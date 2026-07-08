const fs = require('fs');
const path = require('path');

// Mapping of light class to dark variant
const classMapping = [
  // backgrounds
  ['bg-white', 'bg-white dark:bg-gray-800'],
  ['bg-gray-50', 'bg-gray-50 dark:bg-gray-900'],
  ['bg-gray-100', 'bg-gray-100 dark:bg-gray-800'],
  ['bg-gray-200', 'bg-gray-200 dark:bg-gray-700'],
  ['bg-gray-300', 'bg-gray-300 dark:bg-gray-600'],
  ['bg-gray-400', 'bg-gray-400 dark:bg-gray-500'],
  ['bg-gray-500', 'bg-gray-500 dark:bg-gray-400'],
  ['bg-gray-600', 'bg-gray-600 dark:bg-gray-300'],
  ['bg-gray-700', 'bg-gray-700 dark:bg-gray-200'],
  ['bg-gray-800', 'bg-gray-800 dark:bg-gray-100'],
  ['bg-gray-900', 'bg-gray-900 dark:bg-gray-50'],
  // colored backgrounds (light)
  ['bg-blue-50', 'bg-blue-50 dark:bg-blue-900/30'],
  ['bg-red-50', 'bg-red-50 dark:bg-red-900/30'],
  ['bg-green-50', 'bg-green-50 dark:bg-green-900/30'],
  ['bg-yellow-50', 'bg-yellow-50 dark:bg-yellow-900/30'],
  ['bg-purple-50', 'bg-purple-50 dark:bg-purple-900/30'],
  ['bg-pink-50', 'bg-pink-50 dark:bg-pink-900/30'],
  ['bg-indigo-50', 'bg-indigo-50 dark:bg-indigo-900/30'],
  ['bg-orange-50', 'bg-orange-50 dark:bg-orange-900/30'],
  // text colors
  ['text-gray-400', 'text-gray-400 dark:text-gray-300'],
  ['text-gray-500', 'text-gray-500 dark:text-gray-400'],
  ['text-gray-600', 'text-gray-600 dark:text-gray-300'],
  ['text-gray-700', 'text-gray-700 dark:text-gray-200'],
  ['text-gray-800', 'text-gray-800 dark:text-gray-100'],
  ['text-gray-900', 'text-gray-900 dark:text-gray-50'],
  // colored text (light)
  ['text-blue-600', 'text-blue-600 dark:text-blue-400'],
  ['text-red-600', 'text-red-600 dark:text-red-400'],
  ['text-green-600', 'text-green-600 dark:text-green-400'],
  ['text-yellow-600', 'text-yellow-600 dark:text-yellow-400'],
  ['text-purple-600', 'text-purple-600 dark:text-purple-400'],
  ['text-pink-600', 'text-pink-600 dark:text-pink-400'],
  ['text-indigo-600', 'text-indigo-600 dark:text-indigo-400'],
  ['text-orange-600', 'text-orange-600 dark:text-orange-400'],
  // border colors
  ['border-gray-100', 'border-gray-100 dark:border-gray-700'],
  ['border-gray-200', 'border-gray-200 dark:border-gray-600'],
  ['border-gray-300', 'border-gray-300 dark:border-gray-500'],
  ['border-gray-400', 'border-gray-400 dark:border-gray-400'],
  ['border-gray-500', 'border-gray-500 dark:border-gray-300'],
  // divide colors
  ['divide-gray-100', 'divide-gray-100 dark:divide-gray-700'],
  // ring colors (if any)
  ['ring-gray-100', 'ring-gray-100 dark:ring-gray-700'],
  // hover variants (we'll add dark:hover)
  // This is more complex; we'll handle later.
];

// Helper to replace class names in a string
function replaceClasses(content) {
  let newContent = content;
  for (const [light, dark] of classMapping) {
    // Regex to match the class name as a whole class (surrounded by whitespace or quotes)
    // We'll also avoid replacing if already has dark variant (simple check)
    const regex = new RegExp(`(\\s|["'])${light}(\\s|["'])`, 'g');
    if (newContent.includes(light) && !newContent.includes(`${light} dark:`)) {
      // Replace with dark variant, preserving surrounding characters
      newContent = newContent.replace(regex, `$1${dark}$2`);
    }
  }
  return newContent;
}

// Process all .vue files in src directory recursively
function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.name.endsWith('.vue')) {
      console.log(`Processing ${fullPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = replaceClasses(content);
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`  Updated ${fullPath}`);
      }
    }
  }
}

const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  processDirectory(srcDir);
  console.log('Dark mode variants added.');
} else {
  console.error('src directory not found.');
}