import { createRouter, createWebHistory } from 'vue-router'
import { AuthService } from '../services/AuthService'
import { TUTORIAL_STORAGE_KEY_PREFIX } from '../services/tutorial/tutorialSteps'

// Import views
import Landing from '../views/Landing.vue'
import Dashboard from '../views/Dashboard.vue'
import Inventory from '../views/Inventory.vue'
import Reports from '../views/Reports.vue'
import Settings from '../views/Settings.vue'
import MilestoneTemplates from '../views/MilestoneTemplates.vue'
import MilestoneTemplateForm from '../views/MilestoneTemplateForm.vue'
import AIAssistant from '../views/AIAssistant.vue'
import ToolsIndex from '../views/tools/ToolsIndex.vue'
import BblToCase from '../views/tools/BblToCase.vue'
import CsvSearch from '../views/tools/CsvSearch.vue'
import Ledger from '../views/Ledger.vue'
import ParLevels from '../views/ParLevels.vue'
import BatchesList from '../views/BatchesList.vue'
import BatchDetail from '../views/BatchDetail.vue'
import BatchForm from '../views/BatchForm.vue'
import BatchRecipeConsume from '../views/BatchRecipeConsume.vue'
import Receive from '../views/Receive.vue'
import Consume from '../views/Consume.vue'
import Transfer from '../views/Transfer.vue'
import LocationsList from '../views/LocationsList.vue'
import LocationForm from '../views/LocationForm.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ResetPassword from '../views/ResetPassword.vue'
import TTBForm from '../views/TTBForm.vue'
import Removals from '../views/Removals.vue'
import Losses from '../views/Losses.vue'
import ItemsList from '../views/ItemsList.vue'
import ItemForm from '../views/ItemForm.vue'
import Beers from '../views/Beers.vue'
import RecipeList from '../views/RecipeList.vue'
import RecipeForm from '../views/RecipeForm.vue'
import Vessels from '../views/Vessels.vue'
import Serving from '../views/Serving.vue'
import BillingRedirect from '../views/BillingRedirect.vue'
import Integrations from '../views/Integrations.vue'
import SalesOrder from '../views/SalesOrder.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Landing, meta: { requiresAuth: false, isLanding: true, title: 'BrewLedger – Operations Platform for Breweries' } },
    { path: '/login', component: Login, meta: { requiresAuth: false, title: 'Login - BrewLedger' } },
    { path: '/register', component: Register, meta: { requiresAuth: false, title: 'Register - BrewLedger' } },
    { path: '/forgot-password', component: ForgotPassword, meta: { requiresAuth: false, title: 'Forgot password - BrewLedger' } },
    { path: '/reset', component: ResetPassword, meta: { requiresAuth: false, title: 'Reset password - BrewLedger' } },
    { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true, title: 'Dashboard - BrewLedger' } },
    { path: '/inventory', component: Inventory, meta: { requiresAuth: true, title: 'Inventory - BrewLedger' } },
    { path: '/receive', component: Receive, meta: { requiresAuth: true, title: 'Receive - BrewLedger' } },
    { path: '/consume', component: Consume, meta: { requiresAuth: true, title: 'Consume - BrewLedger' } },
    { path: '/transfer', component: Transfer, meta: { requiresAuth: true, title: 'Transfer - BrewLedger' } },
    { path: '/beers', component: Beers, meta: { requiresAuth: true, title: 'Beers - BrewLedger' } },
    { path: '/items', component: ItemsList, meta: { requiresAuth: true, title: 'Items - BrewLedger' } },
    { path: '/items/add', component: ItemForm, meta: { requiresAuth: true, title: 'Add Item - BrewLedger' } },
    { path: '/items/:id/edit', component: ItemForm, meta: { requiresAuth: true, title: 'Edit Item - BrewLedger' } },
    { path: '/locations', component: LocationsList, meta: { requiresAuth: true, title: 'Locations - BrewLedger' } },
    { path: '/locations/add', component: LocationForm, meta: { requiresAuth: true, title: 'Add Location - BrewLedger' } },
    { path: '/locations/:id/edit', component: LocationForm, meta: { requiresAuth: true, title: 'Edit Location - BrewLedger' } },
    { path: '/par-levels', component: ParLevels, meta: { requiresAuth: true, title: 'Par Levels - BrewLedger' } },
    { path: '/recipes', component: RecipeList, meta: { requiresAuth: true, title: 'Recipes - BrewLedger' } },
    { path: '/recipes/add', component: RecipeForm, meta: { requiresAuth: true, title: 'New Recipe - BrewLedger' } },
    { path: '/recipes/:id/edit', component: RecipeForm, meta: { requiresAuth: true, title: 'Edit Recipe - BrewLedger' } },
    { path: '/batches', component: BatchesList, meta: { requiresAuth: true, title: 'Batches - BrewLedger' } },
    { path: '/batches/add', component: BatchForm, meta: { requiresAuth: true, title: 'New Batch - BrewLedger' } },
    { path: '/batches/:id', component: BatchDetail, meta: { requiresAuth: true, title: 'Batch - BrewLedger' } },
    { path: '/batches/:batchId/consume-recipe/:recipeId', component: BatchRecipeConsume, meta: { requiresAuth: true, title: 'Consume Recipe - BrewLedger' } },
    { path: '/vessels', component: Vessels, meta: { requiresAuth: true, title: 'Vessels - BrewLedger' } },
    { path: '/ledger', component: Ledger, meta: { requiresAuth: true, title: 'Ledger - BrewLedger' } },
    { path: '/reports', component: Reports, meta: { requiresAuth: true, title: 'Reports - BrewLedger' } },
    { path: '/reports/ttb-form', component: TTBForm, meta: { requiresAuth: true, title: 'TTB Form 5130.9 - BrewLedger' } },
    { path: '/serving', component: Serving, meta: { requiresAuth: true, title: 'Serving - BrewLedger' } },
    { path: '/removals', component: Removals, meta: { requiresAuth: true, title: 'Beer Removals - BrewLedger' } },
    { path: '/losses', component: Losses, meta: { requiresAuth: true, title: 'Losses & Theft - BrewLedger' } },
    { path: '/integrations', component: Integrations, meta: { requiresAuth: true, title: 'Integrations - BrewLedger' } },
    { path: '/sales-order', component: SalesOrder, meta: { requiresAuth: true, title: 'Sales Order - BrewLedger' } },
    { path: '/ai-assistant', component: AIAssistant, meta: { requiresAuth: true, title: 'AI Assistant - BrewLedger' } },
    { path: '/tools', component: ToolsIndex, meta: { requiresAuth: false, isTools: true, title: 'Brewery Tools | BrewLedger' } },
    { path: '/tools/bbl-to-case', component: BblToCase, meta: { requiresAuth: false, isTools: true, title: 'BBL to Case Converter | BrewLedger' } },
    { path: '/tools/csv-search', component: CsvSearch, meta: { requiresAuth: false, isTools: true, title: 'CSV Search | BrewLedger' } },
    { path: '/settings', component: Settings, meta: { requiresAuth: true, title: 'Settings - BrewLedger' } },
    { path: '/billing/success', component: BillingRedirect, meta: { requiresAuth: true, title: 'Billing - BrewLedger' } },
    { path: '/billing/cancel', component: BillingRedirect, meta: { requiresAuth: true, title: 'Billing - BrewLedger' } },
    { path: '/milestone-templates', component: MilestoneTemplates, meta: { requiresAuth: true, title: 'Milestone Templates - BrewLedger' } },
    { path: '/milestone-templates/add', component: MilestoneTemplateForm, meta: { requiresAuth: true } },
    { path: '/milestone-templates/:id/edit', component: MilestoneTemplateForm, meta: { requiresAuth: true } },
  ]
})

// Auth guard
let tokenValidationCache = { isValid: null, timestamp: 0 }
const TOKEN_VALIDATION_CACHE_MS = 60000 // Cache for 1 minute

/** Routes the tutorial may navigate to. When trial is expired, allow these if user has active tutorial. */
const TUTORIAL_ROUTE_PATHS = [
  '/dashboard', '/locations', '/items', '/receive', '/par-levels',
  '/batches', '/recipes', '/removals', '/reports/ttb-form'
]

function hasActiveTutorial(orgId, userId) {
  if (!orgId || !userId) return false
  try {
    const key = `${TUTORIAL_STORAGE_KEY_PREFIX}${orgId}_${userId}`
    const raw = localStorage.getItem(key)
    if (!raw) return false
    const p = JSON.parse(raw)
    return !!p.startedAt
  } catch {
    return false
  }
}

function isTutorialRoute(path) {
  return TUTORIAL_ROUTE_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

// Export function to clear cache (for logout)
export const clearTokenCache = () => {
  tokenValidationCache = { isValid: null, timestamp: 0 }
}

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !token) {
    // Redirect to login if trying to access protected route without token
    next('/login')
    return
  }

  const isAuthPageAllowedWhenLoggedIn = to.path === '/forgot-password' || to.path === '/reset'
  if (!requiresAuth && token && !to.meta.isLanding && !to.meta.isTools && !isAuthPageAllowedWhenLoggedIn) {
    // Redirect to dashboard if trying to access login/register while authenticated
    next('/dashboard')
    return
  }

  // Check subscription status and token validity for protected routes
  if (requiresAuth && token) {
    // Check token validity (with caching)
    const now = Date.now()
    let isValid = tokenValidationCache.isValid
    
    if (!isValid || (now - tokenValidationCache.timestamp) > TOKEN_VALIDATION_CACHE_MS) {
      isValid = await AuthService.checkAuth()
      tokenValidationCache = { isValid, timestamp: now }
    }
    
    if (!isValid) {
      next('/login')
      return
    }

    // Check subscription status
    const session = await AuthService.getSession()
    if (session) {
      const isTrialExpired = (session.subscriptionStatus === 'trialing' || !session.subscriptionStatus) && 
                             session.trialEndsAt && 
                             new Date() > new Date(session.trialEndsAt)

      if (session.subscriptionStatus === 'cancelled' || isTrialExpired) {
        // Allow access to settings and billing
        if (to.path === '/settings' || to.path.startsWith('/billing/')) {
          next()
          return
        }
        // Allow tutorial routes when user has active tutorial (avoids redirect loop at step 9)
        if (
          hasActiveTutorial(session.orgId, session.userId) &&
          isTutorialRoute(to.path)
        ) {
          next()
          return
        }
        // Redirect others to Settings billing tab
        next({ path: '/settings', query: { tab: 'billing' } })
        return
      }
    }
  }

  next()
})

// Clear cache on route changes that might affect auth
router.beforeEach(() => {
  // Clear cache if token is removed from localStorage
  const token = localStorage.getItem('token')
  if (!token && tokenValidationCache.isValid !== null) {
    tokenValidationCache = { isValid: null, timestamp: 0 }
  }
})

export default router
