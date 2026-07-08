/**
 * Create a Stripe billing portal configuration.
 *
 * Set in .env:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PORTAL_PRODUCTS_JSON — JSON array, e.g.:
 *     [{"product":"prod_xxx","prices":["price_xxx"]},{"product":"prod_yyy","prices":["price_yyy"]}]
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
if (!stripeKey) {
  console.error('Set STRIPE_SECRET_KEY in .env to run this script.');
  process.exit(1);
}

const productsJson = (process.env.STRIPE_PORTAL_PRODUCTS_JSON || '').trim();
if (!productsJson) {
  console.error('Set STRIPE_PORTAL_PRODUCTS_JSON in .env (JSON array of { product, prices }).');
  process.exit(1);
}

let products;
try {
  products = JSON.parse(productsJson);
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('Expected a non-empty JSON array');
  }
} catch (err) {
  console.error('Invalid STRIPE_PORTAL_PRODUCTS_JSON:', err.message);
  process.exit(1);
}

const stripe = require('stripe')(stripeKey);

async function createConfig() {
  try {
    console.log('Attempting to create config...');
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your BrewLedger Subscription',
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'always_invoice',
          products: products
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'other']
          }
        },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
      },
    });
    console.log('Success! Config ID:', configuration.id);
  } catch (err) {
    console.error('Error creating config:', err);
  }
}

createConfig();
