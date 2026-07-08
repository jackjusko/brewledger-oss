require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
if (!stripeKey) {
  console.error('Set STRIPE_SECRET_KEY in .env to run this script.');
  process.exit(1);
}

const targetIds = (process.env.STRIPE_PRODUCT_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

if (targetIds.length === 0) {
  console.error('Set STRIPE_PRODUCT_IDS in .env (comma-separated product IDs).');
  process.exit(1);
}

const stripe = require('stripe')(stripeKey);

async function check() {
  try {
    const products = await stripe.products.list();
    console.log('Existing Products:', products.data.map(p => ({ id: p.id, name: p.name })));

    const prices = await stripe.prices.list({ limit: 100 });
    console.log('Prices:', prices.data.map(p => ({ id: p.id, product: p.product, unit_amount: p.unit_amount })));

    const missing = targetIds.filter(id => !products.data.find(p => p.id === id));

    if (missing.length > 0) {
      console.log('Missing IDs:', missing);
    } else {
      console.log('All target IDs exist.');
    }
  } catch (e) {
    console.error(e);
  }
}

check();
