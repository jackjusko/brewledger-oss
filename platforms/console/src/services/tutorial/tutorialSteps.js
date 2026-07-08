/**
 * Brewer-friendly tutorial step definitions.
 * Core workflow only: setup → inventory → production → removals → TTB → done.
 * No Settings-tab steps (brewery_info, users_roles) or Reports hub (reports_exports) in the
 * linear flow—they require query params or can cause redirect loops.
 */

export const TUTORIAL_STORAGE_KEY_PREFIX = 'tutorial_progress_'

/** Normalize path for matching (no trailing slash, consistent shape). */
function normalizePath(path) {
  if (path == null || typeof path !== 'string') return ''
  return path.replace(/\/+$/, '') || '/'
}

/** Route match: exact path, or path prefix. For settings, routeQueryTab must match query.tab. */
function routeMatches(step, path, query = {}) {
  const normalized = normalizePath(path)
  const routePath = step.routePath
  if (!routePath) return false
  if (step.routeQueryTab && query.tab !== step.routeQueryTab) return false
  if (step.routeExact) return normalized === routePath
  if (normalized === routePath) return true
  if (normalized.startsWith(routePath + '/')) return true
  return false
}

export function getStepForRoute(path, query = {}, completedIds = [], skippedIds = []) {
  const steps = TUTORIAL_STEPS
  const done = new Set([...(completedIds || []), ...(skippedIds || [])])
  const matches = steps.filter((s) => routeMatches(s, path, query))
  if (matches.length === 0) return null
  // If multiple steps share a route, prefer the first unfinished; otherwise, use the last match.
  const unfinished = matches.find((s) => !done.has(s.id))
  return unfinished || matches[matches.length - 1] || null
}

/** Route path for the first step that is not completed and not skipped (for "resume" when current route doesn't match any step). */
export function getResumeRoute(completedIds = [], skippedIds = []) {
  const done = new Set([...completedIds, ...skippedIds])
  const step = TUTORIAL_STEPS.find((s) => !done.has(s.id))
  if (!step || step.routePath == null) return null
  let path = String(step.routePath)
  if (step.routeQueryTab) path += `?tab=${step.routeQueryTab}`
  return path || null
}

export function getStepById(id) {
  return TUTORIAL_STEPS.find((s) => s.id === id) || null
}

export function getNextStep(currentId) {
  const idx = TUTORIAL_STEPS.findIndex((s) => s.id === currentId)
  if (idx < 0 || idx >= TUTORIAL_STEPS.length - 1) return null
  return TUTORIAL_STEPS[idx + 1]
}

/** Only steps with simple routePath (no routeQueryTab) are used for prev-route navigation.
 * Steps with routeQueryTab are included in next-route so we can navigate to Settings tabs. */
function isNavigableStep(step) {
  if (!step || step.routePath == null) return false
  if (step.routeQueryTab) return false
  return true
}

function buildStepPath(step) {
  if (!step || step.routePath == null) return null
  let path = String(step.routePath)
  if (step.routeQueryTab) path += `?tab=${step.routeQueryTab}`
  return path || null
}

export function getNextRoute(currentId) {
  let idx = TUTORIAL_STEPS.findIndex((s) => s.id === currentId)
  if (idx < 0) return null
  idx += 1
  while (idx < TUTORIAL_STEPS.length) {
    const next = TUTORIAL_STEPS[idx]
    if (next && next.routePath != null) {
      return buildStepPath(next)
    }
    idx += 1
  }
  return null
}

export function getPrevStepId(currentId) {
  let idx = TUTORIAL_STEPS.findIndex((s) => s.id === currentId)
  if (idx <= 0) return null
  idx -= 1
  while (idx >= 0) {
    const prev = TUTORIAL_STEPS[idx]
    if (isNavigableStep(prev)) return prev.id
    idx -= 1
  }
  return null
}

export function getPrevRoute(currentId) {
  const prevId = getPrevStepId(currentId)
  if (!prevId) return null
  const prev = getStepById(prevId)
  return prev && prev.routePath ? String(prev.routePath) : null
}

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    routePath: '/dashboard',
    routeExact: true,
    title: 'Welcome to BrewLedger',
    body: "We'll get you from grain to glass with clean records. This short tour shows you the basics—one step at a time.",
    whyCare: 'Keeping good records helps with TTB reporting and day-to-day brewing decisions.',
    actionLabel: "Got it, let's go",
    mobileCallout: "On mobile, your data syncs when you're back online.",
    order: 0,
  },
  {
    id: 'locations',
    routePath: '/locations',
    title: 'Locations',
    body: "Creating a location is the first thing you do. Record your physical storage spots—cellar, keg room, cold box—where you keep inventory.",
    whyCare: 'Locations let you track where stock lives so you can receive, transfer, and report accurately.',
    actionLabel: "I've added a location",
    mobileCallout: "On mobile you'll see a compact stage selector.",
    order: 1,
  },
  {
    id: 'inventory_items',
    routePath: '/items',
    title: 'Inventory items',
    body: "These are the things you track—ingredients, malt, hops, yeast, finished beer. Give each a name and unit (lbs, gal, etc.). You'll use them whenever you receive stock, brew, or report.",
    whyCare: "Items are the building blocks of your records. Every receive, transfer, and removal ties back to an item.",
    actionLabel: "I've added an item",
    mobileCallout: 'Same fields on mobile, slimmer layout.',
    order: 2,
  },
  {
    id: 'receiving',
    routePath: '/receive',
    routeExact: true,
    title: 'Receiving inventory',
    body: "When a delivery arrives or you bring stock into a location, this is where you record it. Pick where it went, what it is, and how much. Keeps your on-hand totals accurate for brewing and reporting.",
    whyCare: "Receiving is how stock gets into your records. Every receive creates a clear trail for audits and decisions.",
    actionLabel: "I see my new balance",
    mobileCallout: null,
    order: 3,
  },
  {
    id: 'counts',
    routePath: '/par-levels',
    routeExact: true,
    title: 'Par levels',
    body: "Set minimum stock levels for each item so you know when to reorder. Par levels help you avoid running out of malt, hops, or packaging—and you can scope them by location.",
    whyCare: "Par levels drive low-stock alerts and reorder decisions. Set them once and the system flags when you're running low.",
    actionLabel: "I've set a par level",
    mobileCallout: "On mobile, par levels appear in the reorder view.",
    order: 4,
  },
  {
    id: 'batches',
    routePath: '/batches',
    routeExact: true,
    title: 'Batches',
    body: "Each batch is a brew from grain to glass. You can see vessels, ingredients used, and milestones. When a batch is done, you can set it for storage or serving—that's when it shows up in your inventory and tax records.",
    whyCare: "Batches tie each brew to ingredients and finished beer for inventory and TTB reporting.",
    actionLabel: "I've seen the batches page",
    mobileCallout: null,
    order: 5,
  },
  {
    id: 'recipes_beers',
    routePath: '/recipes',
    routeExact: true,
    title: 'Recipes & beers',
    body: "A recipe defines your beer—ingredients and quantities. When you use a recipe for a batch, it prefills the beer and deducts those ingredients from inventory. Use it whenever you're brewing and want your records to match what went into the tank.",
    whyCare: "Recipes save you from re-entering the same brew again and again. They keep your inventory and product records in sync.",
    actionLabel: "I've seen how recipes work",
    mobileCallout: null,
    order: 6,
  },
  {
    id: 'removals',
    routePath: '/removals',
    routeExact: true,
    title: 'Removals & tax status',
    body: "When beer or inventory leaves your control—taproom pour, sale, export, sample—record it here. Pick a purpose and tax status. Your records stay accurate and your TTB report fills in correctly.",
    whyCare: "Removals are required for tax reporting. Purpose and tax status tell the TTB where each removal belongs.",
    actionLabel: "I've recorded a removal",
    mobileCallout: null,
    order: 7,
  },
  {
    id: 'ttb_form',
    routePath: '/reports/ttb-form',
    routeExact: true,
    title: 'TTB Form 5130.9',
    body: "This is your monthly or quarterly TTB report. Pick a period, generate it, resolve any gaps the system flags, then export the PDF. Your recorded removals and production feed into the right columns.",
    whyCare: "This is the report the TTB requires. Fixing gaps before you file keeps you compliant.",
    actionLabel: "Next",
    mobileCallout: null,
    order: 8,
  },
  {
    id: 'milestone_templates',
    routePath: '/settings',
    routeQueryTab: 'milestones',
    title: 'Milestone templates',
    body: "Milestone templates define the checkpoints for your batches—knockout, fermentation, cold crash, packaging, production complete, and so on. You create a template with the stages that match your process, then assign it to batches. Each batch gets a timeline of milestones you can complete as you brew.",
    whyCare: "Templates keep your batch workflow consistent. The last milestone (Production Complete) is required for TTB—that's when beer enters your inventory.",
    actionLabel: "Next",
    mobileCallout: null,
    order: 9,
  },
  {
    id: 'tour_complete',
    routePath: '/dashboard',
    routeExact: true,
    title: "You're all set",
    body: "That's the end of the tour. Explore on your own—good shot.",
    whyCare: null,
    actionLabel: 'Close',
    hideSkip: true,
    mobileCallout: null,
    order: 10,
  },
]
