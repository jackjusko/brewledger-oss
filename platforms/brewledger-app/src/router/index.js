import { createRouter, createWebHistory } from "vue-router";
import { AuthService } from "../services/AuthService";
import Dashboard from "../views/Dashboard.vue";
import ItemsList from "../views/ItemsList.vue";
import ItemForm from "../views/ItemForm.vue";
import LocationsList from "../views/LocationsList.vue";
import LocationForm from "../views/LocationForm.vue";
import Receive from "../views/Receive.vue";
import Count from "../views/Count.vue";
import BatchRecipeConsume from "../views/BatchRecipeConsume.vue";
import RecipeList from "../views/RecipeList.vue";
import RecipeForm from "../views/RecipeForm.vue";
import CountSession from "../views/CountSession.vue";
import BatchesList from "../views/BatchesList.vue";
import BatchDetail from "../views/BatchDetail.vue";
import BatchForm from "../views/BatchForm.vue";
import Consume from "../views/Consume.vue";
import LowStock from "../views/LowStock.vue";
import Ledger from "../views/Ledger.vue";
import Export from "../views/Export.vue";
import Settings from "../views/Settings.vue";
import MilestoneTemplates from "../views/MilestoneTemplates.vue";
import MilestoneTemplateForm from "../views/MilestoneTemplateForm.vue";
import VesselsList from "../views/VesselsList.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Inventory from "../views/Inventory.vue";
import Transfer from "../views/Transfer.vue";
import RemoveBeer from "../views/RemoveBeer.vue";
import ReorderList from "../views/ReorderList.vue";
import Serving from "../views/Serving.vue";
import Beers from "../views/Beers.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Dashboard },
    { path: "/login", component: Login },
    { path: "/register", component: Register },
    { path: "/billing", redirect: "/settings" },
    { path: "/billing/success", redirect: "/settings" },
    { path: "/billing/cancel", redirect: "/settings" },
    { path: "/inventory", component: Inventory },
    { path: "/transfer", component: Transfer },
    { path: "/remove-beer", component: RemoveBeer },
    { path: "/serving", component: Serving },
    { path: "/reorder", component: ReorderList },
    { path: "/recipes", component: RecipeList },
    { path: "/recipes/add", component: RecipeForm },
    { path: "/recipes/:id/edit", component: RecipeForm },
    { path: "/items", component: ItemsList },
    { path: "/items/add", component: ItemForm },
    { path: "/items/:id/edit", component: ItemForm },
    { path: "/locations", component: LocationsList },
    { path: "/locations/add", component: LocationForm },
    { path: "/locations/:id/edit", component: LocationForm },
    { path: "/receive", component: Receive },
    { path: "/count", component: Count },
    { path: "/count/:locationId", component: CountSession },
    { path: "/batches", component: BatchesList },
    { path: "/batches/add", component: BatchForm },
    { path: "/batches/:id", component: BatchDetail },
    {
      path: "/batches/:batchId/consume-recipe/:recipeId",
      component: BatchRecipeConsume,
    },
    { path: "/consume", component: Consume },
    { path: "/ledger", component: Ledger },
    { path: "/export", component: Export },
    { path: "/settings", component: Settings },
    { path: "/milestone-templates", component: MilestoneTemplates },
    { path: "/milestone-templates/add", component: MilestoneTemplateForm },
    { path: "/milestone-templates/:id/edit", component: MilestoneTemplateForm },
    { path: "/vessels", component: VesselsList },
    { path: "/beers", component: Beers },
  ],
});

router.beforeEach(async (to, from, next) => {
  const publicPages = ["/login", "/register"];
  const authRequired = !publicPages.includes(to.path);
  const session = await AuthService.getSession();

  if (authRequired && !session) {
    return next("/login");
  }

  if (session && publicPages.includes(to.path)) {
    return next("/");
  }

  const isTrialExpired =
    session &&
    (session.subscriptionStatus === "trialing" ||
      !session.subscriptionStatus) &&
    session.trialEndsAt &&
    new Date() > new Date(session.trialEndsAt);

  if (
    session &&
    (session.subscriptionStatus === "cancelled" || isTrialExpired)
  ) {
    if (to.path !== "/settings") {
      return next("/settings");
    }
  }

  next();
});

export default router;
