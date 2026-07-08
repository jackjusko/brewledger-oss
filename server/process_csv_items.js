require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');
const { connect, initDb } = require('./init_db');
const OpenAI = require('openai');
const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_PRESET_ID = process.env.OPENROUTER_PRESET_CSV || process.env.OPENROUTER_PRESET || '';
const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY || null;
const ENABLE_WEB_SEARCH = process.env.ENABLE_WEB_SEARCH !== 'false';

if (!OPENROUTER_API_KEY) {
  console.error('Set OPENROUTER_API_KEY in .env to run the CSV processor.');
  process.exit(1);
}

// Web search cache to avoid duplicate searches
const searchCache = new Map();
const MAX_CACHE_SIZE = 1000; // Limit cache size

console.log(`Using OpenRouter preset: ${OPENROUTER_PRESET_ID}`);
console.log(`Web search: ${ENABLE_WEB_SEARCH && BRAVE_SEARCH_API_KEY ? 'ENABLED (Brave Search API)' : 'DISABLED'}`);

// Initialize OpenAI SDK configured for OpenRouter
const openai = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/your-repo', // Optional, for OpenRouter leaderboards
    'X-Title': 'Brewster CSV Processor', // Optional, for OpenRouter leaderboards
  },
});

// Web search function using Brave Search API
async function searchWeb(query) {
  if (!ENABLE_WEB_SEARCH || !BRAVE_SEARCH_API_KEY) {
    return null;
  }

  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  if (searchCache.has(cacheKey)) {
    console.log(`  Using cached web search result`);
    return searchCache.get(cacheKey);
  }

  try {
    const searchQuery = `${query} brewery supply brewing`;
    console.log(`  Searching web for: ${searchQuery}`);
    
    // Brave Search API endpoint
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.append('q', searchQuery);
    url.searchParams.append('count', '5'); // Get top 5 results
    
    const options = {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_SEARCH_API_KEY
      }
    };

    const results = await new Promise((resolve, reject) => {
      https.get(url.toString(), options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error(`Failed to parse Brave Search response: ${e.message}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    // Extract relevant information from search results
    const webResults = results.web?.results || [];
    const snippets = webResults
      .slice(0, 3) // Use top 3 results
      .map(r => r.description || r.title)
      .filter(Boolean)
      .join(' | ');

    if (snippets) {
      console.log(`  Found web search context (${snippets.length} chars)`);
      
      // Cache the result (with size limit)
      if (searchCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry (simple FIFO)
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
      }
      searchCache.set(cacheKey, snippets);
      
      return snippets;
    } else {
      return null;
    }
  } catch (error) {
    console.log(`  Web search failed: ${error.message}`);
    return null;
  }
}

// Determine if an item needs web search (only for truly ambiguous items)
// This is selective to avoid unnecessary searches - only ~5-10% of items should trigger this
function needsWebSearch(category, description) {
  if (!ENABLE_WEB_SEARCH || !BRAVE_SEARCH_API_KEY) {
    return false;
  }

  const descLower = description.toLowerCase();
  const catLower = (category || '').toLowerCase();
  
  // Only search for items that are truly ambiguous or unclear
  const ambiguousKeywords = [
    'unknown', 'misc', 'other', 'various', 'assorted',
    'special', 'custom', 'generic', 'unlisted', 'unidentified',
    'miscellaneous', 'etc', 'and more'
  ];
  
  // Check if description or category contains ambiguous terms
  const hasAmbiguousTerm = ambiguousKeywords.some(keyword => 
    descLower.includes(keyword) || catLower.includes(keyword)
  );
  
  // Also search if category code is very generic or missing
  const isGenericCategory = !category || category.length < 3 || 
    ['GEN', 'MISC', 'OTH', 'VAR', 'UNK', 'XXX'].includes(category.toUpperCase());
  
  // Check if description is too short or vague (less than 10 chars or just numbers/codes)
  const isVagueDescription = description.length < 10 || /^[A-Z0-9\s\-]+$/.test(description);
  
  // Check for items that might be misclassified as cleaning (common issue)
  // These are often brewing ingredients/equipment that sound like cleaning supplies
  const mightBeMisclassified = [
    'sanitizer', 'sterilizer', 'cleaner', 'wash', 'rinse', 'soap',
    'detergent', 'degreaser', 'acid', 'alkaline', 'ph', 'buffer'
  ].some(keyword => descLower.includes(keyword));
  
  // Only search if multiple ambiguity indicators are present (to reduce search volume)
  const ambiguityScore = (hasAmbiguousTerm ? 1 : 0) + 
                         (isGenericCategory ? 1 : 0) + 
                         (isVagueDescription ? 1 : 0) +
                         (mightBeMisclassified ? 1 : 0);
  
  // Require at least 2 indicators to trigger web search (reduces searches by ~80%)
  // But always search if it might be misclassified as cleaning
  return ambiguityScore >= 2 || mightBeMisclassified;
}

// OpenRouter API call function using preset with optional web search
async function callOpenRouter(category, product, description, ax) {
  // Perform web search if item seems ambiguous
  let webSearchContext = null;
  if (needsWebSearch(category, description)) {
    const searchQuery = `${description} ${product || ''}`.trim();
    webSearchContext = await searchWeb(searchQuery);
    
    // Add delay after web search to respect rate limits
    if (webSearchContext) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Build prompt with optional web search context
  let contextSection = '';
  if (webSearchContext) {
    contextSection = `

ADDITIONAL WEB SEARCH CONTEXT:
${webSearchContext}

Use this web search context to help categorize the item more accurately.`;
  }

  const prompt = `Extract structured data from this brewery supply item description:${contextSection}

Category Code: ${category}
Product Code: ${product}
Description: ${description}
AX Code: ${ax || 'N/A'}

CONTEXT: This item is being used at a BREWERY. Think about how it's used in the brewing process when categorizing.

BREWERY CONTEXT FOR CATEGORIZATION:
- Consider the item's role in the BREWING PROCESS, not just its name
- Think about WHEN and HOW it's used in brewery operations
- Items used DURING brewing (mash, boil, fermentation) are typically ingredients or equipment
- Items used AFTER brewing (cleaning equipment) are typically cleaning supplies
- Items used FOR brewing (tools, systems, pumps) are typically equipment

CRITICAL: Distinguish between cleaning supplies, ingredients, packaging, and equipment:

- CLEANING: Items used ONLY for cleaning/sanitizing equipment AFTER brewing is complete
  * Examples: "PBW" (cleans equipment), "Star San" (sanitizes equipment), "CIP cleaner", "dish soap", "equipment cleaner"
  * These are NOT part of the beer - they clean the equipment
  
- INGREDIENT: Items that become part of the beer or are added during the brewing/packaging process
  * Examples: "campden tablets" (used in brewing to remove chlorine), "sulfites" (used in brewing), "brewing salts" (gypsum, calcium chloride - added to water for brewing), "acid blend" (pH adjustment during brewing), "yeast nutrient", "finings", "carbonation tablets" (added to bottles to carbonate beer), "priming sugar" (used for carbonation), "bottle conditioning drops"
  * These become part of or affect the beer itself - even if used during packaging, they're ingredients
  
- PACKAGING: Physical containers and materials that hold or label the beer (NOT additives used in packaging)
  * Examples: "bottles", "caps", "labels", "boxes", "cans", "kegs", "crowns", "shrink wrap", "packaging tape"
  * These are the physical containers/materials - NOT additives used during packaging
  * IMPORTANT: Carbonation tablets, priming sugar, bottle conditioning drops are INGREDIENTS (not packaging) - they're added to the beer
  
- EQUIPMENT: Items that are tools/systems used in the brewing process
  * Examples: "sanitizer pump" (equipment for sanitizing), "CIP system" (cleaning-in-place system), "sterilization equipment", "filters", "pumps", "valves", "bottling equipment"
  * These are tools/systems used in brewery operations

Common misclassifications to avoid (think in brewery context):
- "Star San" or "PBW" → cleaning (correct - used to clean equipment AFTER brewing)
- "Campden tablets" or "sulfites" → ingredient (NOT cleaning - used IN the brewing process to treat water/beer)
- "Brewing salts" (gypsum, calcium chloride) → ingredient (NOT cleaning - added to brewing water to affect beer chemistry)
- "Acid blend" for pH adjustment → ingredient (NOT cleaning - used during brewing to adjust mash/beer pH)
- "Sanitizer pump" → equipment (NOT cleaning - it's a piece of equipment)
- "CIP system" → equipment (NOT cleaning - it's a system, even though it cleans)
- "Yeast nutrient" → ingredient (NOT cleaning - added to beer during fermentation)
- "Finings" → ingredient (NOT cleaning - added to beer to clarify it)
- "Carbonation tablets" → ingredient (NOT packaging - they're added to beer to carbonate it)
- "Priming sugar" → ingredient (NOT packaging - it's sugar added to beer for carbonation)
- "Bottle conditioning drops" → ingredient (NOT packaging - they're additives for carbonation)
- "Bottles" → packaging (correct - physical container)
- "Caps" → packaging (correct - physical container closure)
- "Labels" → packaging (correct - physical label material)

Return a JSON object with:
- name: Clean product name (remove quantities, codes, special characters like ~S, ~D, ~HAZ)
- type_class: One of ["ingredient", "packaging", "equipment", "cleaning", "other"]
  * Use "cleaning" ONLY for items used to clean equipment AFTER brewing
  * Use "ingredient" for items that become part of the beer or are added during brewing/packaging (including carbonation tablets, priming sugar, bottle conditioning drops)
  * Use "packaging" ONLY for physical containers/materials (bottles, caps, labels, boxes, cans, kegs) - NOT additives used during packaging
  * Use "equipment" for tools/systems used in the brewing process
- category: MUST be one of these EXACT standardized values (use the exact string, do not create variations):
  * For ingredients: "malt/grain", "hops", "yeast", "ingredient/additives", "ingredient/adjuncts", "ingredient/spices"
  * For packaging: "packaging/bottles", "packaging/caps", "packaging/labels", "packaging/boxes", "packaging/cans", "packaging/kegs", "packaging/accessories"
  * For equipment: "equipment", "equipment/filters", "equipment/pumps", "equipment/valves"
  * For cleaning: "cleaning"
  * For other: "other"
  * DO NOT use variations like "malt", "grain", "bottles", "caps" - use the EXACT values above with forward slashes
- unit: The base unit that each individual item is measured in (normalize: lb/LB/Lbs → "lb", oz/OZ → "oz", kg/KG → "kg", g → "g", each/pack/count → "each", fl oz → "fl oz", gal → "gal"). This is the unit for tracking inventory.
- vendor: Brand/vendor name if identifiable (e.g., "Muntons", "Crisp", "Briess", "BSG", etc.)
- interval: If description mentions bulk packaging quantities (e.g., "50 lb bag" → 50, "25kg tote" → 25, "55 lb" → 55, "1 Lb" → null), extract the quantity per package/unit as a number. This represents how many base units are in each package. If no bulk packaging is mentioned, return null.

Examples:
Input: "Muntons Wheat DME 5 LB~S"
Output: {"name": "Muntons Wheat DME", "type_class": "ingredient", "category": "malt/grain", "unit": "lb", "vendor": "Muntons", "interval": 5}
Explanation: This is a 5 lb bag, so unit="lb" (base measurement), interval=5 (5 lbs per bag)

Input: "Flaked Corn 10 Lb"
Output: {"name": "Flaked Corn", "type_class": "ingredient", "category": "malt/grain", "unit": "lb", "vendor": null, "interval": 10}
Explanation: This is a 10 lb package, so unit="lb", interval=10 (10 lbs per package)

Input: "Crisp Organic Extra Pale Tote"
Output: {"name": "Crisp Organic Extra Pale", "type_class": "ingredient", "category": "malt/grain", "unit": "lb", "vendor": "Crisp", "interval": null}
Explanation: "Tote" typically means bulk, but no specific quantity mentioned, so interval=null. Unit is still "lb" as that's the standard measurement.

Input: "Carbonation Tabs 280 count"
Output: {"name": "Carbonation Tabs", "type_class": "ingredient", "category": "ingredient/additives", "unit": "each", "vendor": null, "interval": 280}
Explanation: Carbonation tablets are INGREDIENTS (not packaging) - they're added to beer to carbonate it. Category must be EXACTLY "ingredient/additives" (not "additives" or "ingredients"). This is a pack of 280 tabs, so unit="each" (individual tabs), interval=280 (280 tabs per pack)

Input: "12oz Brown Bottles Case"
Output: {"name": "12oz Brown Bottles", "type_class": "packaging", "category": "packaging/bottles", "unit": "each", "vendor": null, "interval": null}
Explanation: Bottles are PACKAGING - they're physical containers. Case quantity not specified, so interval=null.

Return ONLY valid JSON, no other text.`;

  try {
    // Use preset ID as the model parameter (OpenRouter presets use @preset/ format)
    // Preset format: @preset/your-preset-slug
    const model = OPENROUTER_PRESET_ID.startsWith('@preset/') 
      ? OPENROUTER_PRESET_ID 
      : `@preset/${OPENROUTER_PRESET_ID}`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured data from brewery supply item descriptions. Always return valid JSON only. CRITICAL: Use EXACT category values from the provided list - do not create variations or use different words. Categories must match exactly (e.g., "malt/grain" not "malt" or "grain", "packaging/bottles" not "bottles").'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      response_format: { type: 'json_object' }
    });
    
    const content = completion.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error calling OpenRouter API:`, error);
    throw error;
  }
}

// Standardized category values - these are the ONLY valid categories
const VALID_CATEGORIES = {
  // Ingredients
  'malt/grain': 'malt/grain',
  'hops': 'hops',
  'yeast': 'yeast',
  'ingredient/additives': 'ingredient/additives',
  'ingredient/adjuncts': 'ingredient/adjuncts',
  'ingredient/spices': 'ingredient/spices',
  // Packaging
  'packaging/bottles': 'packaging/bottles',
  'packaging/caps': 'packaging/caps',
  'packaging/labels': 'packaging/labels',
  'packaging/boxes': 'packaging/boxes',
  'packaging/cans': 'packaging/cans',
  'packaging/kegs': 'packaging/kegs',
  'packaging/accessories': 'packaging/accessories',
  // Equipment
  'equipment': 'equipment',
  'equipment/filters': 'equipment/filters',
  'equipment/pumps': 'equipment/pumps',
  'equipment/valves': 'equipment/valves',
  // Cleaning & Other
  'cleaning': 'cleaning',
  'other': 'other'
};

// Normalize category to standardized value
function normalizeCategory(category, typeClass) {
  if (!category) {
    // Default categories based on type_class if category is missing
    const defaults = {
      'ingredient': 'other',
      'packaging': 'packaging/accessories',
      'equipment': 'equipment',
      'cleaning': 'cleaning',
      'other': 'other'
    };
    return defaults[typeClass] || 'other';
  }

  const catLower = category.toLowerCase().trim();
  
  // Direct match
  if (VALID_CATEGORIES[catLower]) {
    return VALID_CATEGORIES[catLower];
  }

  // Try to map common variations to standardized values
  const categoryMap = {
    // Malt/Grain variations
    'malt': 'malt/grain',
    'grain': 'malt/grain',
    'malt and grain': 'malt/grain',
    'malt & grain': 'malt/grain',
    
    // Hops variations
    'hop': 'hops',
    
    // Additives variations
    'additives': 'ingredient/additives',
    'additive': 'ingredient/additives',
    'ingredients': 'ingredient/additives',
    'ingredient': 'ingredient/additives',
    
    // Packaging variations
    'bottles': 'packaging/bottles',
    'bottle': 'packaging/bottles',
    'caps': 'packaging/caps',
    'cap': 'packaging/caps',
    'labels': 'packaging/labels',
    'label': 'packaging/labels',
    'boxes': 'packaging/boxes',
    'box': 'packaging/boxes',
    'cans': 'packaging/cans',
    'can': 'packaging/cans',
    'kegs': 'packaging/kegs',
    'keg': 'packaging/kegs',
    'packaging': 'packaging/accessories',
    
    // Equipment variations
    'equipment/filter': 'equipment/filters',
    'equipment/pump': 'equipment/pumps',
    'equipment/valve': 'equipment/valves',
    
    // Cleaning variations
    'cleaners': 'cleaning',
    'cleaner': 'cleaning',
    'sanitizer': 'cleaning',
    'sanitizers': 'cleaning'
  };

  if (categoryMap[catLower]) {
    return categoryMap[catLower];
  }

  // If no match found, return default based on type_class
  const defaults = {
    'ingredient': 'ingredient/additives',
    'packaging': 'packaging/accessories',
    'equipment': 'equipment',
    'cleaning': 'cleaning',
    'other': 'other'
  };
  
  return defaults[typeClass] || 'other';
}

// Normalize unit
function normalizeUnit(unit) {
  if (!unit) return null;
  const normalized = unit.toLowerCase().trim();
  const unitMap = {
    'lb': 'lb',
    'lbs': 'lb',
    'pound': 'lb',
    'pounds': 'lb',
    'oz': 'oz',
    'ounce': 'oz',
    'ounces': 'oz',
    'kg': 'kg',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'g': 'g',
    'gram': 'g',
    'grams': 'g',
    'each': 'each',
    'pack': 'each',
    'count': 'each',
    'fl oz': 'fl oz',
    'fluid ounce': 'fl oz',
    'gal': 'gal',
    'gallon': 'gal',
    'gallons': 'gal'
  };
  return unitMap[normalized] || normalized;
}

// Process CSV and generate SQL inserts
async function processCSV() {
  const csvPath = path.resolve(__dirname, '..', '..', 'BSGSupply.csv');
  
  // Initialize database to ensure item_templates table exists
  console.log('Initializing database...');
  await initDb();
  
  const db = connect();
  const now = new Date().toISOString();
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  const errors = [];

  console.log('Starting CSV processing...');
  console.log(`Reading from: ${csvPath}`);

  return new Promise((resolve, reject) => {
    const rows = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        console.log(`Found ${rows.length} rows to process`);
        
        // Process rows with rate limiting
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          processed++;
          
          // Skip empty rows
          if (!row.Category || !row.Product || !row.Description) {
            console.log(`Skipping row ${i + 1}: Missing required fields`);
            continue;
          }

          // Retry logic - keep retrying until success
          let retryCount = 0;
          let rowProcessed = false;

          while (!rowProcessed) {
            try {
              // Check if web search is needed before calling API
              const needsSearch = needsWebSearch(row.Category, row.Description);
              
              // Call OpenRouter API (with optional web search)
              if (retryCount > 0) {
                console.log(`Retrying row ${i + 1}/${rows.length} (attempt ${retryCount + 1}): ${row.Description.substring(0, 50)}...`);
              } else {
                console.log(`Processing row ${i + 1}/${rows.length}: ${row.Description.substring(0, 50)}...`);
              }
              
              const extracted = await callOpenRouter(
                row.Category,
                row.Product,
                row.Description,
                row.AX
              );

              // Validate and normalize
              if (!extracted.name) {
                throw new Error('Missing name in extracted data');
              }

              const normalizedUnit = normalizeUnit(extracted.unit);
              const normalizedCategory = normalizeCategory(extracted.category, extracted.type_class);
              const itemId = uuidv4();

              // Insert into database
              await new Promise((resolve, reject) => {
                db.run(
                  `INSERT INTO item_templates (id, name, type_class, category, unit, interval, price, vendor, description, product_code, ax_code, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    itemId,
                    extracted.name,
                    extracted.type_class || null,
                    normalizedCategory,
                    normalizedUnit,
                    extracted.interval || null,
                    extracted.price || null,
                    extracted.vendor || null,
                    row.Description,
                    row.Product,
                    row.AX || null,
                    now
                  ],
                  function(err) {
                    if (err) {
                      // Check for duplicate product_code
                      if (err.message.includes('UNIQUE constraint')) {
                        console.log(`Skipping duplicate product_code: ${row.Product}`);
                        resolve();
                      } else {
                        reject(err);
                      }
                    } else {
                      successful++;
                      resolve();
                    }
                  }
                );
              });

              // Success - mark as processed
              rowProcessed = true;
              
              if (retryCount > 0) {
                console.log(`✓ Successfully processed row ${i + 1} after ${retryCount + 1} attempts`);
              }
              
              // Rate limiting: 4 second delay between row processing
              if (i < rows.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 4000)); // 4 second delay
              }
            } catch (error) {
              retryCount++;
              
              // Wait before retrying (exponential backoff: 2^retryCount seconds, max 16 seconds)
              const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 16000); // Max 16 seconds
              console.error(`Error processing row ${i + 1} (attempt ${retryCount}):`, error.message);
              console.log(`Retrying in ${retryDelay / 1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              
              // Continue loop to retry
            }
          }

          // Progress update every 50 rows
          if (processed % 50 === 0) {
            console.log(`Progress: ${processed}/${rows.length} processed, ${successful} successful, ${failed} failed`);
          }
        }

        // Close database
        db.close();

        // Summary
        console.log('\n=== Processing Complete ===');
        console.log(`Total rows processed: ${processed}`);
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${failed}`);

        if (errors.length > 0) {
          console.log('\n=== Errors ===');
          const errorLogPath = path.resolve(__dirname, 'csv_processing_errors.json');
          fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
          console.log(`Errors logged to: ${errorLogPath}`);
        }

        resolve({ processed, successful, failed, errors });
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        db.close();
        reject(error);
      });
  });
}

// Run if called directly
if (require.main === module) {
  processCSV()
    .then((result) => {
      console.log('\nProcessing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { processCSV };
