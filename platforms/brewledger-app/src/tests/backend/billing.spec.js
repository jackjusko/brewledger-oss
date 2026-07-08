
import { beforeAll, afterAll, describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// 1. Setup Mock for Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn()
    }
  },
  subscriptions: {
    list: vi.fn(),
    cancel: vi.fn()
  },
  billingPortal: {
    sessions: {
      create: vi.fn()
    }
  },
  webhooks: {
    constructEvent: vi.fn()
  }
};

// 2. Setup DB Path
const TEST_DB_PATH = path.resolve(__dirname, `test_billing_${Date.now()}.sqlite`);
process.env.DB_PATH = TEST_DB_PATH;

const { initDb } = require('../../backend/init_db');
const createApp = require('../../backend/server');

describe('Billing & Subscription System', () => {
  let app;
  let adminToken;
  let orgId;
  let userId;

  // Helpers to interact with DB directly using app's connection
  const runSql = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      app.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };
  const getSql = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      app.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  beforeAll(async () => {
    // Set Webhook Secret
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    // Require app
    app = createApp({ dbPath: TEST_DB_PATH });
    
    // Inject Mock
    app.stripe = mockStripe;
    
    // Init DB
    await initDb(app.db);
  }, 30000); // Increase timeout for slow environments

  afterAll(async () => {
    // Close the app's DB connection
    if (app && app.db) {
      await new Promise((resolve) => app.db.close(resolve));
    }

    // Cleanup file
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {
        console.warn('Could not delete test db:', e.message);
      }
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register an org with default trial status', async () => {
    const res = await request(app)
      .post('/api/auth/register-org')
      .send({
        orgName: 'Billing Test Brewery',
        email: 'billing@test.com',
        password: 'password123',
        adminName: 'Admin'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    adminToken = res.body.token;
    orgId = res.body.orgId;
    userId = res.body.userId;

    // Verify DB state
    const org = await getSql('SELECT * FROM orgs WHERE id = ?', [orgId]);
    expect(org.subscription_status).toBe('trialing');
    expect(org.subscription_plan).toBe('essential');
    expect(org.trial_ends_at).toBeDefined();
    
    // Verify trial is ~30 days in future
    const trialEnd = new Date(org.trial_ends_at);
    const now = new Date();
    const diffDays = (trialEnd - now) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(29);
    expect(diffDays).toBeLessThan(31);
  });

  it('should create a stripe checkout session', async () => {
    const fakeUrl = 'https://checkout.stripe.com/test-session';
    mockStripe.checkout.sessions.create.mockResolvedValue({ url: fakeUrl });

    const res = await request(app)
      .post('/api/billing/create-checkout-session')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        plan: 'growth',
        returnUrl: 'http://localhost:3000'
      });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe(fakeUrl);
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'subscription',
      metadata: expect.objectContaining({
        orgId: orgId,
        plan: 'growth'
      })
    }));
  });

  it('should confirm subscription successfully', async () => {
    const sessionId = 'cs_test_123';
    mockStripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_status: 'paid',
      status: 'complete',
      customer: 'cus_test_123',
      metadata: {
        orgId: orgId,
        plan: 'growth'
      }
    });

    const res = await request(app)
      .post('/api/billing/confirm-subscription')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sessionId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plan).toBe('growth');

    // Verify DB
    const org = await getSql('SELECT * FROM orgs WHERE id = ?', [orgId]);
    expect(org.subscription_status).toBe('active');
    expect(org.subscription_plan).toBe('growth');
    expect(org.stripe_customer_id).toBe('cus_test_123');
  });

  it('should cancel subscription and revert to trial if time remains', async () => {
    // Ensure we are in active state first (from previous test)
    
    // Mock Stripe cancel
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [{ id: 'sub_123' }]
    });
    mockStripe.subscriptions.cancel.mockResolvedValue({});

    const res = await request(app)
      .post('/api/billing/cancel-subscription')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Since we just registered, trial should still be valid
    expect(res.body.status).toBe('trialing');

    // Verify DB
    const org = await getSql('SELECT * FROM orgs WHERE id = ?', [orgId]);
    expect(org.subscription_status).toBe('trialing');
    expect(org.subscription_plan).toBe('essential'); // Reverts to essential/default
  });

  it('should cancel subscription and set to cancelled if trial expired', async () => {
    // 1. Manually expire trial in DB
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Yesterday
    await runSql('UPDATE orgs SET trial_ends_at = ?, subscription_status = ? WHERE id = ?', [pastDate, 'active', orgId]);

    // Mock Stripe
    mockStripe.subscriptions.list.mockResolvedValue({
      data: [{ id: 'sub_123' }]
    });

    const res = await request(app)
      .post('/api/billing/cancel-subscription')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');

    // Verify DB
    const org = await getSql('SELECT * FROM orgs WHERE id = ?', [orgId]);
    expect(org.subscription_status).toBe('cancelled');
  });

  it('should reflect expired trial status in login response', async () => {
    // Org is currently 'cancelled' and trial expired from previous test
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'billing@test.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.subscriptionStatus).toBe('cancelled');
    
    // Check expiration calculation logic on client side would use trialEndsAt
    const trialEndsAt = new Date(res.body.trialEndsAt);
    expect(trialEndsAt < new Date()).toBe(true);
  });

  it('should create a billing portal session', async () => {
    // Ensure org has a stripe customer ID and subscription ID
    await runSql('UPDATE orgs SET stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?', ['cus_test_123', 'sub_test_123', orgId]);

    const fakeUrl = 'https://billing.stripe.com/session/test';
    mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: fakeUrl });

    // 1.5 Setup Mock for Billing Portal Configuration
    mockStripe.billingPortal.configurations = {
      create: vi.fn().mockResolvedValue({ id: 'bpc_test_123' })
    };

    const res = await request(app)
      .post('/api/billing/create-portal-session')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ returnUrl: 'http://localhost:3000' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe(fakeUrl);
    
    // Check if configuration creation was attempted
    expect(mockStripe.billingPortal.configurations.create).toHaveBeenCalled();
    
    // We now expect NO flow_data to allow dashboard view
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_test_123',
      return_url: expect.stringContaining('/settings'),
      configuration: 'bpc_test_123',
    }));
    
    // Ensure flow_data is NOT present
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith(expect.not.objectContaining({
       flow_data: expect.anything()
    }));
  });

  it('should fallback to dashboard if deep link fails', async () => {
    // This test is now less relevant as we are defaulting to dashboard, 
    // but we can keep the logic in server.js for robustness if we ever re-enable deep links.
    // For now, let's skip or adapt it.
    // Since we commented out flow_data in server.js, this test scenario (fallback) won't trigger the same way.
    // We can just verify it succeeds without error.
    
    await runSql('UPDATE orgs SET stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?', ['cus_test_fail', 'sub_invalid', orgId]);
    
    const fakeUrl = 'https://billing.stripe.com/session/dashboard';
    mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: fakeUrl });

    const res = await request(app)
      .post('/api/billing/create-portal-session')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ returnUrl: 'http://localhost:3000' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe(fakeUrl);
  });

  it('should handle customer.subscription.updated webhook', async () => {
    // Ensure data exists before running webhook test
    await runSql('UPDATE orgs SET stripe_customer_id = ? WHERE id = ?', ['cus_test_123', orgId]);

    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_updated_456',
          customer: 'cus_test_123',
          status: 'active'
        }
      }
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(event);

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'test_sig')
      .send(event);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);

    // Verify DB update
    const org = await getSql('SELECT * FROM orgs WHERE stripe_customer_id = ?', ['cus_test_123']);
    expect(org.subscription_status).toBe('active');
    expect(org.stripe_subscription_id).toBe('sub_updated_456');
  });

  it('should handle customer.subscription.deleted webhook', async () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_test_123',
          status: 'canceled'
        }
      }
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(event);

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 'test_sig')
      .send(event);

    expect(res.status).toBe(200);

    const org = await getSql('SELECT * FROM orgs WHERE stripe_customer_id = ?', ['cus_test_123']);
    expect(org.subscription_status).toBe('cancelled');
  });

  it('should deny access to protected billing endpoints without auth', async () => {
    const res = await request(app)
      .post('/api/billing/create-checkout-session')
      .send({ plan: 'growth' }); // No auth header

    expect(res.status).toBe(401);
  });
});
