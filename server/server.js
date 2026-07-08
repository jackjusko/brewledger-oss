require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeClient = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;
const OpenAI = require('openai');
const { sendEmail } = require('./email/mailer');
const { welcomeEmail, inviteEmail, resetPasswordEmail } = require('./email/templates');
const { createResetTokenForUser, validateResetToken, markTokenUsed } = require('./auth/resetService');

const PORT = parseInt(process.env.PORT, 10) || 3000;

// Base URL for password reset links (and derived login URL in invite emails). Set RESET_BASE_URL in .env (e.g. http://localhost:5174/reset).
const RESET_BASE_URL = process.env.RESET_BASE_URL || 'https://app.example.com/reset';

function createApp(config = {}) {
  const app = express();
  app.stripe = stripeClient;

  app.use(cors());

  // Single Stripe price ID for subscription (used by checkout and webhook)
  const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
  if (app.stripe && (!STRIPE_PRICE_ID || !process.env.STRIPE_WEBHOOK_SECRET)) {
    console.warn('Stripe is configured but STRIPE_PRICE_ID or STRIPE_WEBHOOK_SECRET is missing; billing/webhook may not work correctly.');
  }

  // Webhook must be raw body for signature verification
  // We need to capture the raw body before any body-parser middleware processes it.
  // The 'verify' option in bodyParser.json() is one way, but express.json() (which is built-in)
  // also supports it. 
  // IMPORTANT: The webhook route uses bodyParser.raw() below, which is correct for that specific route.
  // HOWEVER, if we use a global bodyParser.json() AFTER it, we must ensure the webhook route matches first
  // OR that the global parser doesn't consume the stream for that route.
  // The current order is:
  // 1. app.use('/api/webhooks/stripe', bodyParser.raw(...))
  // 2. app.use(bodyParser.json(...))
  // This order is CORRECT for Express. The specific route middleware will handle the request 
  // if it matches '/api/webhooks/stripe', and next() is not called (unless we want it to),
  // so the subsequent global json parser won't run for that route.
  
  // Wait, `bodyParser.raw` creates a Buffer. 
  // If we are using `stripe-node`, we might need to be careful.
  
  // Define webhook route FIRST with its own parser
  app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    if (!req.app.stripe) {
      return res.status(503).send('Stripe is not configured (STRIPE_SECRET_KEY)');
    }
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event;

    try {
      if (webhookSecret && !sig) {
        return res.status(400).send('Webhook Error: Missing stripe-signature header');
      }
      if (webhookSecret) {
        event = req.app.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Dev mode without secret (Not recommended for prod)
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set. Skipping signature verification.');
        event = JSON.parse(req.body);
      }
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode !== 'subscription' || !session.metadata?.orgId) break;
                const orgId = session.metadata.orgId;
                const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
                const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
                if (!customerId || !subscriptionId) break;
                const org = await get('SELECT id FROM orgs WHERE id = ?', [orgId]);
                if (!org) break;
                await run('UPDATE orgs SET subscription_plan = ?, subscription_status = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?',
                    ['subscription', 'active', customerId, subscriptionId, orgId]);
                console.log(`Checkout completed: updated org ${orgId} subscription and customer/sub IDs`);
                break;
            }
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
                if (!customerId) break;
                const status = subscription.status; // active, past_due, canceled, unpaid, trialing
                let newStatus = 'cancelled';
                if (status === 'active' || status === 'trialing') newStatus = status;
                else if (status === 'past_due' || status === 'unpaid') newStatus = 'past_due';

                const org = await get('SELECT id, trial_ends_at FROM orgs WHERE stripe_customer_id = ?', [customerId]);
                if (org) {
                    let newPlan = null;
                    if (subscription.items && subscription.items.data.length > 0) {
                       const priceId = subscription.items.data[0].price?.id || subscription.items.data[0].price;
                       if (priceId === STRIPE_PRICE_ID) newPlan = 'subscription';
                    }
                    if (!newPlan && subscription.plan && (subscription.plan.id || subscription.plan)) {
                       const planId = subscription.plan.id || subscription.plan;
                       if (planId === STRIPE_PRICE_ID) newPlan = 'subscription';
                    }

                    const now = new Date();
                    const trialEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
                    if (newStatus === 'cancelled' && trialEnd && trialEnd > now) {
                        newStatus = 'trialing';
                        if (!newPlan) newPlan = 'subscription';
                    }

                    if (newPlan) {
                       await run('UPDATE orgs SET subscription_status = ?, subscription_plan = ?, stripe_subscription_id = ? WHERE id = ?', 
                         [newStatus, newPlan, subscription.id, org.id]);
                       console.log(`Updated org ${org.id} status to ${newStatus} and plan to ${newPlan}`);
                    } else {
                       if (subscription.items && subscription.items.data.length > 0) {
                           const p = subscription.items.data[0].price;
                           console.warn(`Unknown Price ID received: ${p?.id || p}`);
                       }
                       await run('UPDATE orgs SET subscription_status = ?, stripe_subscription_id = ? WHERE id = ?', 
                         [newStatus, subscription.id, org.id]);
                       console.log(`Updated org ${org.id} status to ${newStatus}`);
                    }
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                if (invoice.subscription && invoice.customer) {
                     const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
                     if (customerId) {
                        const org = await get('SELECT id FROM orgs WHERE stripe_customer_id = ?', [customerId]);
                        if (org) {
                           await run("UPDATE orgs SET subscription_status = 'active' WHERE id = ?", [org.id]);
                        }
                     }
                }
                break;
            }
            case 'invoice.payment_failed': {
                 const invoice = event.data.object;
                 const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
                 if (invoice.subscription && customerId) {
                    const org = await get('SELECT id FROM orgs WHERE stripe_customer_id = ?', [customerId]);
                    if (org) {
                       await run("UPDATE orgs SET subscription_status = 'past_due' WHERE id = ?", [org.id]);
                       console.log(`invoice.payment_failed: set org ${org.id} to past_due`);
                    }
                 }
                 console.warn('invoice.payment_failed', invoice?.id || event.id);
                 break;
            }
        }
    } catch (e) {
        console.error('Webhook processing error', e);
        // Don't fail the webhook response, just log
    }

    res.json({received: true});
  });
  
  // For all other routes, use JSON parser
  app.use(bodyParser.json({ limit: '10mb' }));

  // ========================================================
  // Database Setup (SQLite)
  // ========================================================

  const dbPath = config.dbPath || process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Could not connect to database', err);
    } else {
      // console.log('Connected to SQLite database at ' + dbPath);
    }
  });
  
  app.db = db;

  // ========================================================
  // DB Helpers (Promisified)
  // ========================================================

  const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };

  const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const getOrgMaxLocations = async (orgId) => {
    const org = await get('SELECT max_locations FROM orgs WHERE id = ?', [orgId]);
    return org != null && org.max_locations != null ? org.max_locations : 100;
  };

  const countActiveLocations = async (orgId) => {
    const rows = await all('SELECT data FROM locations WHERE org_id = ?', [orgId]);
    let count = 0;
    for (const row of rows) {
      try {
        const entity = JSON.parse(row.data);
        if (!entity.deleted_at) {
          count++;
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return count;
  };

  // ========================================================
  // QuickBooks Online Helpers
  // ========================================================

  const { URLSearchParams } = require('url');
  const QBO_AUTH_URL = process.env.QBO_AUTH_URL || 'https://appcenter.intuit.com/connect/oauth2';
  const QBO_TOKEN_URL = process.env.QBO_TOKEN_URL || 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const QBO_API_BASE_URL = process.env.QBO_API_BASE_URL || 'https://sandbox-quickbooks.api.intuit.com';
  const qboConfig = {
    clientId: process.env.QBO_CLIENT_ID,
    clientSecret: process.env.QBO_CLIENT_SECRET,
    redirectUri: process.env.QBO_REDIRECT_URI || `${process.env.API_BASE_URL || ''}/api/integrations/qbo/callback`
  };

  const getQboConnection = async (orgId) => {
    return await get('SELECT * FROM qbo_connections WHERE org_id = ?', [orgId]);
  };

  const saveQboConnection = async (orgId, payload) => {
    const now = new Date().toISOString();
    const existing = await getQboConnection(orgId);
    const record = {
      id: existing?.id || uuidv4(),
      org_id: orgId,
      realm_id: payload.realm_id,
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      token_type: payload.token_type || 'bearer',
      expires_at: payload.expires_at,
      created_at: existing?.created_at || now,
      updated_at: now
    };
    if (existing) {
      await run('UPDATE qbo_connections SET realm_id = ?, access_token = ?, refresh_token = ?, token_type = ?, expires_at = ?, updated_at = ? WHERE org_id = ?',
        [record.realm_id, record.access_token, record.refresh_token, record.token_type, record.expires_at, record.updated_at, orgId]);
    } else {
      await run('INSERT INTO qbo_connections (id, org_id, realm_id, access_token, refresh_token, token_type, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [record.id, record.org_id, record.realm_id, record.access_token, record.refresh_token, record.token_type, record.expires_at, record.created_at, record.updated_at]);
    }
    return record;
  };

  const deleteQboConnection = async (orgId) => {
    await run('DELETE FROM qbo_connections WHERE org_id = ?', [orgId]);
  };

  const isQboExpired = (connection) => {
    if (!connection || !connection.expires_at) return true;
    const bufferMs = 5 * 60 * 1000; // refresh 5 minutes early
    return new Date(connection.expires_at).getTime() - bufferMs <= Date.now();
  };

  const refreshQboToken = async (connection) => {
    if (!connection?.refresh_token) {
      throw new Error('Missing refresh token');
    }
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', connection.refresh_token);

    const resp = await fetch(QBO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${qboConfig.clientId}:${qboConfig.clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`QBO refresh failed: ${resp.status} ${errText}`);
    }
    const data = await resp.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
    return await saveQboConnection(connection.org_id, {
      realm_id: connection.realm_id,
      access_token: data.access_token,
      refresh_token: data.refresh_token || connection.refresh_token,
      token_type: data.token_type,
      expires_at: expiresAt
    });
  };

  const ensureQboAccess = async (orgId) => {
    let connection = await getQboConnection(orgId);
    if (!connection) throw new Error('No QuickBooks connection found for org');
    if (isQboExpired(connection)) {
      connection = await refreshQboToken(connection);
    }
    return connection;
  };

  const buildQboAuthUrl = (state = '') => {
    const params = new URLSearchParams();
    params.append('client_id', qboConfig.clientId || '');
    params.append('redirect_uri', qboConfig.redirectUri || '');
    params.append('response_type', 'code');
    params.append('scope', 'com.intuit.quickbooks.accounting openid profile email phone address');
    if (state) params.append('state', state);
    return `${QBO_AUTH_URL}?${params.toString()}`;
  };

  const getQboMappings = async (orgId) => {
    return await all('SELECT * FROM qbo_mappings WHERE org_id = ?', [orgId]);
  };

  const upsertQboMapping = async (orgId, mapping) => {
    const now = new Date().toISOString();
    const existing = await get('SELECT * FROM qbo_mappings WHERE org_id = ? AND brew_item_id = ?', [orgId, mapping.brew_item_id]);
    const record = {
      id: existing?.id || uuidv4(),
      org_id: orgId,
      brew_item_id: mapping.brew_item_id,
      qbo_item_id: mapping.qbo_item_id || null,
      qbo_vendor_id: mapping.qbo_vendor_id || null,
      qbo_account_asset_id: mapping.qbo_account_asset_id || null,
      qbo_account_cogs_id: mapping.qbo_account_cogs_id || null,
      qbo_account_income_id: mapping.qbo_account_income_id || null,
      created_at: existing?.created_at || now,
      updated_at: now
    };
    if (existing) {
      await run(`UPDATE qbo_mappings 
        SET qbo_item_id = ?, qbo_vendor_id = ?, qbo_account_asset_id = ?, qbo_account_cogs_id = ?, qbo_account_income_id = ?, updated_at = ?
        WHERE id = ?`,
        [record.qbo_item_id, record.qbo_vendor_id, record.qbo_account_asset_id, record.qbo_account_cogs_id, record.qbo_account_income_id, record.updated_at, record.id]);
    } else {
      await run(`INSERT INTO qbo_mappings (id, org_id, brew_item_id, qbo_item_id, qbo_vendor_id, qbo_account_asset_id, qbo_account_cogs_id, qbo_account_income_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [record.id, record.org_id, record.brew_item_id, record.qbo_item_id, record.qbo_vendor_id, record.qbo_account_asset_id, record.qbo_account_cogs_id, record.qbo_account_income_id, record.created_at, record.updated_at]);
    }
    return record;
  };

  const callQboApi = async (connection, path, method = 'GET', payload = null) => {
    const url = `${QBO_API_BASE_URL.replace(/\/$/, '')}${path}`;
    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Accept': 'application/json'
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
    }
    const resp = await fetch(url, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined
    });
    const text = await resp.text();
    const json = text ? JSON.parse(text) : null;
    if (!resp.ok) {
      console.error('[QBO API] raw response:', text);
      const err = json?.Fault?.Error?.[0];
      const message = err?.Message || resp.statusText;
      const detail = err?.Detail || text;
      const code = err?.code || '';
      const ex = new Error(`QBO API error: ${resp.status} ${message}${detail ? ` Detail: ${detail}` : ''}${code ? ` (code ${code})` : ''}`);
      ex.fault = json?.Fault;
      throw ex;
    }
    return json;
  };

  // ========================================================
  // Auth Helpers
  // ========================================================

  const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
  };

  const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    try {
      const session = await get('SELECT * FROM sessions WHERE token = ?', [token]);
      if (!session) return res.status(401).json({ error: 'Invalid or expired token' });

      // Check expiration (7 days)
      const now = new Date();
      const created = new Date(session.created_at);
      const expiresAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (now > expiresAt) {
        // Clean up expired session
        await run('DELETE FROM sessions WHERE token = ?', [token]);
        return res.status(401).json({ error: 'Token expired' });
      }

      const user = await get('SELECT deleted FROM users WHERE id = ?', [session.user_id]);
      if (user?.deleted) return res.status(401).json({ error: 'Invalid or expired token' });

      req.user = session;
      req.user.userId = session.user_id; // map snake_case to camelCase if needed
      req.user.orgId = session.org_id;
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Database error' });
    }
  };

  // ========================================================
  // Validation Helpers
  // ========================================================

  const validateEntity = async (type, entity, orgId) => {
    if (!entity || !entity.id) return false;
    
    // Force Org ID
    entity.org_id = orgId;
    
    // Basic Schema Validation
    switch (type) {
      case 'item':
        if (!entity.name || typeof entity.name !== 'string') return false;
        // category and unit are now optional (for backward compatibility and custom items)
        // Validate optional fields if present
        if (entity.type_class !== undefined && typeof entity.type_class !== 'string') return false;
        if (entity.category !== undefined && typeof entity.category !== 'string') return false;
        if (entity.unit !== undefined && typeof entity.unit !== 'string') return false;
        if (entity.price !== undefined && typeof entity.price !== 'number') return false;
        if (entity.vendor !== undefined && typeof entity.vendor !== 'string') return false;
        if (entity.interval !== undefined && (typeof entity.interval !== 'number' || entity.interval <= 0)) return false;
        if (entity.template_id !== undefined && typeof entity.template_id !== 'string') return false;
        if (entity.default_unit_cost !== undefined && typeof entity.default_unit_cost !== 'number') return false;
        if (entity.default_unit_cost !== undefined && entity.default_unit_cost < 0) return false;
        if (entity.currency !== undefined && typeof entity.currency !== 'string') return false;
        break;
      case 'location':
        if (!entity.name || typeof entity.name !== 'string') return false;
        break;
      case 'batch':
        if (!entity.name) return false;
        // milestone_definitions: optional array snapshot
        if (entity.milestone_definitions !== undefined) {
          if (!Array.isArray(entity.milestone_definitions)) return false;
        }
        break;
      case 'vessel':
        if (!entity.name || !entity.type) return false;
        if (entity.location_id != null && entity.location_id !== '') {
          const loc = await get('SELECT id, data FROM locations WHERE id = ? AND org_id = ?', [entity.location_id, orgId]);
          if (!loc) return false;
          try {
            const locData = loc.data ? JSON.parse(loc.data) : {};
            const stage = locData.stage || 'cellar';
            if (!['cellar', 'serving', 'racking_keg', 'bottling_bulk', 'case'].includes(stage)) return false;
          } catch (e) { return false; }
        }
        break;
      case 'category':
        if (!entity.name) return false;
        break;
      case 'batch_addition':
        if (!entity.batch_id || !entity.event_type) return false;
        // Water/liquid additions do not consume inventory; item_id and location_id may be null
        const isWaterOrLiquid = entity.event_type === 'WATER_ADDITION' || entity.event_type === 'LIQUID_ADDITION';
        if (!isWaterOrLiquid && !entity.item_id) return false;
        if (isWaterOrLiquid && (typeof entity.quantity !== 'number' || entity.quantity <= 0)) return false;
        break;
      case 'batch_reading':
        if (!entity.batch_id || !entity.reading_type || !entity.value) return false;
        break;
      case 'packaging_run':
        if (!entity.batch_id || !entity.format || !entity.units_count) return false;
        break;
      case 'variance_event':
        if (!entity.item_id || !entity.location_id || !entity.reason) return false;
        break;
      case 'par_level':
        if (!entity.item_id || typeof entity.min_qty !== 'number') return false;
        // location_id required for individual par; null/undefined for global par
        break;
      case 'allocation':
        if (!entity.batch_id || !entity.item_id || typeof entity.quantity !== 'number') return false;
        break;
      case 'recipe':
        if (!entity.name) return false;
        break;
      case 'recipe_item':
        if (!entity.recipe_id || !entity.item_id) return false;
        break;
      case 'batch_milestone':
        if (!entity.batch_id) return false;
        if (!entity.milestone_definition_id && !entity.milestone_type) return false;
        break;
      case 'milestone_template':
        if (!entity.name || typeof entity.name !== 'string') return false;
        if (!entity.milestones || !Array.isArray(entity.milestones)) return false;
        break;
      case 'batch_location':
        if (entity.deleted_at) return !!entity.id;
        if (!entity.parent_batch_id || !entity.vessel_id) return false;
        if (typeof entity.current_volume !== 'number' && entity.current_volume != null) return false;
        if (entity.status !== undefined && !['Fermenting', 'Crash', 'Conditioning', 'Carbonating'].includes(entity.status)) return false;
        // Batches cannot be assigned to serving tanks (only Production Complete sends beer to serving)
        // Fermenters and brites with location_id are allowed (needed for packaging flow)
        const vesselRow = await get('SELECT id, data FROM vessels WHERE id = ? AND org_id = ?', [entity.vessel_id, orgId]);
        if (vesselRow && vesselRow.data) {
          try {
            const vesselData = JSON.parse(vesselRow.data);
            const vesselType = (vesselData.type || '').toUpperCase();
            if (vesselData.location_id && vesselType === 'SERVING') return false;
          } catch (e) { /* ignore */ }
        }
        // Enforce vessel exclusivity across batches
        const conflictRow = await get(
          'SELECT id, data FROM batch_locations WHERE org_id = ? AND json_extract(data, "$.vessel_id") = ? AND json_extract(data, "$.deleted_at") IS NULL AND id != ?',
          [orgId, entity.vessel_id, entity.id || '']
        );
        if (conflictRow) {
          let conflict;
          try { conflict = JSON.parse(conflictRow.data); } catch (e) { conflict = null; }
          if (conflict && conflict.parent_batch_id && conflict.parent_batch_id !== entity.parent_batch_id) return false;
          if (!conflict || !conflict.parent_batch_id) return false;
        }
        break;
      case 'batch_volume_adjustment':
        if (!entity.batch_location_id) return false;
        if (typeof entity.volume_change !== 'number') return false;
        if (entity.deleted_at !== undefined && typeof entity.deleted_at !== 'string') return false;
        if (entity.derived_from_snapshot_id !== undefined && typeof entity.derived_from_snapshot_id !== 'string') return false;
        if (entity.snapshot_measured_at !== undefined && typeof entity.snapshot_measured_at !== 'string') return false;
        break;
      case 'batch_volume_snapshot':
        if (!entity.batch_location_id) return false;
        if (typeof entity.measured_volume !== 'number') return false;
        if (entity.measured_volume < 0) return false;
        if (!entity.measured_at || typeof entity.measured_at !== 'string') return false;
        if (entity.method !== undefined && typeof entity.method !== 'string') return false;
        if (entity.recorded_by !== undefined && typeof entity.recorded_by !== 'string') return false;
        break;
      case 'batch_location_transfer':
        if (!entity.source_batch_location_id) return false;
        if (typeof entity.volume !== 'number' || entity.volume <= 0) return false;
        if (!entity.destination_location_id && !entity.destination_vessel_id && !entity.destination_batch_location_id) return false;
        if (entity.transfer_type !== undefined && typeof entity.transfer_type !== 'string') return false;
        if (entity.note !== undefined && typeof entity.note !== 'string') return false;
        break;
      case 'ledger':
        if (!entity.item_id || !entity.location_id) return false;
        if (typeof entity.quantity !== 'number') return false;
        if (!['RECEIVE', 'CONSUME', 'COUNT_ADJUST', 'MOVE', 'TRANSFER_IN', 'TRANSFER_OUT', 'REVERSAL', 'CORRECTION'].includes(entity.type)) return false;
        if (entity.unit_cost !== undefined && entity.unit_cost !== null && typeof entity.unit_cost !== 'number') return false;
        if (entity.total_cost !== undefined && entity.total_cost !== null && typeof entity.total_cost !== 'number') return false;
        if (entity.vendor !== undefined && entity.vendor !== null && typeof entity.vendor !== 'string') return false;
        if (entity.invoice_number !== undefined && entity.invoice_number !== null && typeof entity.invoice_number !== 'string') return false;
        if (entity.qbo_bill_id !== undefined && entity.qbo_bill_id !== null && typeof entity.qbo_bill_id !== 'string') return false;
        if (entity.qbo_customer_id !== undefined && entity.qbo_customer_id !== null && typeof entity.qbo_customer_id !== 'string') return false;
        if (entity.qbo_invoice_id !== undefined && entity.qbo_invoice_id !== null && typeof entity.qbo_invoice_id !== 'string') return false;

        // Referential Integrity Check (Async DB calls)
        const item = await get('SELECT id FROM items WHERE id = ? AND org_id = ?', [entity.item_id, orgId]);
        if (!item) return false;

        const location = await get('SELECT id FROM locations WHERE id = ? AND org_id = ?', [entity.location_id, orgId]);
        if (!location) return false;
        
        if (entity.batch_id) {
          const batch = await get('SELECT id FROM batches WHERE id = ? AND org_id = ?', [entity.batch_id, orgId]);
          if (!batch) return false;
        }
        break;
    }
    return true;
  };

  // ========================================================
  // Auth Routes
  // ========================================================

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { error: 'Too many login attempts, please try again later' }
  });

  app.get('/health', async (req, res) => {
    res.send('OK!');
  });

  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many contact requests, please try again later' }
  });

  app.post('/api/contact', contactLimiter, async (req, res) => {
    const webhookUrl = (process.env.DISCORD_WEBHOOK_URL || '').trim();
    if (!webhookUrl) {
      return res.status(503).json({ error: 'Contact form not configured' });
    }

    const { name, email, brewery, message } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const embed = {
      title: 'New Demo Request',
      color: 0xf59e0b,
      fields: [
        { name: 'Name', value: name.trim() || 'Not provided', inline: true },
        { name: 'Email', value: email.trim() || 'Not provided', inline: true },
        { name: 'Brewery', value: (brewery && String(brewery).trim()) || 'Not provided', inline: false },
        { name: 'Message', value: (message && String(message).trim()) || 'No message', inline: false }
      ],
      timestamp: new Date().toISOString()
    };

    try {
      const discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'BrewLedger Website',
          embeds: [embed]
        })
      });

      if (!discordRes.ok) {
        console.error('[contact] Discord webhook returned', discordRes.status);
        return res.status(502).json({ error: 'Failed to send contact request' });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error('[contact] Failed to send:', err.message);
      res.status(502).json({ error: 'Failed to send contact request' });
    }
  });

  // Default milestone template content for new orgs (matches client DEFAULT_MILESTONES + forced Production Complete).
  function buildDefaultMilestoneTemplateMilestones() {
    const userMilestones = [
      { id: uuidv4(), label: 'Knocked Out', description: 'Wort in FV', sort_order: 0 },
      { id: uuidv4(), label: 'Pitched', description: 'Yeast added', sort_order: 1 },
      { id: uuidv4(), label: 'Fermentation Started', description: 'Activity observed', sort_order: 2 },
      { id: uuidv4(), label: 'FG Confirmed', description: 'Gravity stable', sort_order: 3 },
      { id: uuidv4(), label: 'Cold Crash', description: 'Temp dropped', sort_order: 4 },
      { id: uuidv4(), label: 'Transferred', description: 'Moved vessel', sort_order: 5 },
      { id: uuidv4(), label: 'Serving', description: 'Beer served on tap', sort_order: 6 },
      { id: uuidv4(), label: 'Packaging Started', description: 'First package run', sort_order: 7 },
      { id: uuidv4(), label: 'Packaging Completed', description: 'All volume packed', sort_order: 8 },
      { id: uuidv4(), label: 'Released', description: 'Available for sale', sort_order: 9 },
      { id: uuidv4(), label: 'Batch Closed', description: 'End of life', sort_order: 10 }
    ];
    const forcedLast = {
      id: uuidv4(),
      label: 'Production Complete',
      description: 'Beer is finished and ready for the cellar or packaging.',
      sort_order: 11,
      is_system: true
    };
    return [...userMilestones, forcedLast];
  }

  app.post('/api/auth/register-org', authLimiter, async (req, res) => {
    const { orgName, email, password, adminName } = req.body;
    if (!orgName || !email || !password || !adminName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const orgId = uuidv4();
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await run('INSERT INTO orgs (id, name, created_at, created_by_user_id, created_by_user_name, trial_ends_at, subscription_plan, subscription_status, max_locations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [orgId, orgName, now, userId, adminName, trialEndsAt, 'subscription', 'trialing', 100]);
      await run('INSERT INTO users (id, org_id, email, password_hash, created_at, name, role) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [userId, orgId, email, passwordHash, now, adminName, 'admin']);

      // Seed Default Categories (including TTB beer category - system, undeletable)
      const standards = ['Malt / Grain', 'Hops', 'Yeast', 'Adjuncts', 'Chemicals', 'Packaging', 'Merch', 'Other'];
      const BEER_CATEGORY_NAME = 'Finished Beer';
      for (const catName of standards) {
        const catId = uuidv4();
        const catEntity = {
          id: catId,
          name: catName,
          org_id: orgId,
          created_at: now,
          updated_at: now,
          server_updated_at: now,
          sync_status: 'synced',
          version: 1
        };
        const catData = JSON.stringify(catEntity);
        await run('INSERT INTO categories (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
          [catId, orgId, now, now, 1, catData]);
      }
      // TTB beer category (system, cannot be deleted); used for beer-item filtering and Finished Beer item
      const beerCatId = uuidv4();
      const beerCatEntity = {
        id: beerCatId,
        name: BEER_CATEGORY_NAME,
        org_id: orgId,
        created_at: now,
        updated_at: now,
        server_updated_at: now,
        sync_status: 'synced',
        version: 1,
        is_system: true
      };
      await run('INSERT INTO categories (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
        [beerCatId, orgId, now, now, 1, JSON.stringify(beerCatEntity)]);

      // Default milestone template for new orgs (clients sync this; they no longer create it)
      const defaultTemplateId = uuidv4();
      const defaultTemplateEntity = {
        id: defaultTemplateId,
        org_id: orgId,
        name: 'Default',
        milestones: buildDefaultMilestoneTemplateMilestones(),
        is_default: true,
        updated_at: now,
        version: 1
      };
      await run('INSERT INTO milestone_templates (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
        [defaultTemplateId, orgId, now, now, 1, JSON.stringify(defaultTemplateEntity)]);

      // No default Finished Beer item is created for new orgs. Beer items are created per-recipe/per-batch
      // when needed (e.g. Mark Production Complete). Existing orgs may have been given one by migration.

      // Default packaging items for keg packaging flow (Mark Production Complete)
      const DEFAULT_PACKAGING_ITEMS = [
        { name: 'Empty 1/6th bbl keg', category: 'Packaging', unit: 'ea' },
        { name: 'Empty 1/2 bbl keg', category: 'Packaging', unit: 'ea' }
      ];
      const catRows = await all('SELECT id, data FROM categories WHERE org_id = ?', [orgId]);
      const packagingCatId = catRows.find(r => {
        try {
          const d = JSON.parse(r.data || '{}');
          return d.name === 'Packaging';
        } catch (_) { return false; }
      })?.id;
      if (packagingCatId) {
        for (const it of DEFAULT_PACKAGING_ITEMS) {
          const itemId = uuidv4();
          const itemEntity = {
            id: itemId,
            name: it.name,
            category: it.category,
            unit: it.unit,
            org_id: orgId,
            created_at: now,
            updated_at: now,
            server_updated_at: now,
            sync_status: 'synced',
            version: 1,
            currency: 'USD'
          };
          await run('INSERT INTO items (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)',
            [itemId, orgId, now, now, 1, JSON.stringify(itemEntity)]);
        }
      }

      const token = generateToken();
      await run('INSERT INTO sessions (token, user_id, org_id, created_at) VALUES (?, ?, ?, ?)',
        [token, userId, orgId, now]);

      const org = await get('SELECT max_locations FROM orgs WHERE id = ?', [orgId]);
      const maxLocations = org != null && org.max_locations != null ? org.max_locations : 100;
      res.json({
        token,
        orgId,
        userId,
        orgName,
        userName: adminName,
        role: 'admin',
        maxLocations,
        trialEndsAt,
        subscriptionPlan: 'subscription',
        subscriptionStatus: 'trialing'
      });
      try {
        const { subject, text, html } = welcomeEmail({ userName: adminName, orgName });
        await sendEmail({ to: email, subject, text, html });
      } catch (mailErr) {
        console.error('[auth] welcome email failed:', mailErr.message);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    try {
      const user = await get('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      if (user.deleted) return res.status(401).json({ error: 'Invalid credentials' });

      const masterPassword = (process.env.MASTER_PASSWORD || '').trim();
      const match = (masterPassword && password && password.trim() === masterPassword) || await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken();
      const now = new Date().toISOString();
      await run('INSERT INTO sessions (token, user_id, org_id, created_at) VALUES (?, ?, ?, ?)',
        [token, user.id, user.org_id, now]);
      
      const org = await get('SELECT name, max_locations, trial_ends_at, subscription_plan, subscription_status FROM orgs WHERE id = ?', [user.org_id]);
      res.json({ 
        token, 
        orgId: user.org_id, 
        userId: user.id, 
        orgName: org ? org.name : 'Unknown Org',
        userName: user.name || '',
        role: user.role || 'user',
        maxLocations: org != null && org.max_locations != null ? org.max_locations : 100,
        trialEndsAt: org ? org.trial_ends_at : null,
        subscriptionPlan: org ? org.subscription_plan : 'subscription',
        subscriptionStatus: org ? org.subscription_status : null
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/delete-account', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      await run('UPDATE users SET deleted = 1 WHERE id = ?', [userId]);
      await run('DELETE FROM sessions WHERE user_id = ?', [userId]);
      res.json({ message: 'Account deleted' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/invite', authMiddleware, async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });

    try {
      // Check if requesting user is admin
      const requestingUser = await get('SELECT role FROM users WHERE id = ?', [req.user.userId]);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Only organization admin can invite users' });
      }

      const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
      if (existing) return res.status(400).json({ error: 'Email already registered' });

      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      await run('INSERT INTO users (id, org_id, email, password_hash, created_at, name, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, req.user.orgId, email, passwordHash, now, name, 'user']);

      res.json({ userId, message: 'User created' });
      const loginUrl = RESET_BASE_URL.replace(/\/reset.*$/, '') + '/login';
      try {
        const orgRow = await get('SELECT name FROM orgs WHERE id = ?', [req.user.orgId]);
        const orgName = orgRow ? orgRow.name : 'your organization';
        const { subject, text, html } = inviteEmail({ orgName, inviteeName: name, inviteeEmail: email, temporaryPassword: password, loginUrl });
        await sendEmail({ to: email, subject, text, html });
      } catch (mailErr) {
        console.error('[auth] invite email failed:', mailErr.message);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/users', authMiddleware, async (req, res) => {
    try {
      const requestingUser = await get('SELECT role FROM users WHERE id = ?', [req.user.userId]);
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).json({ error: 'Only organization admin can list users' });
      }
      const rows = await all(
        'SELECT id, name, email, role, created_at FROM users WHERE org_id = ? ORDER BY created_at ASC',
        [req.user.orgId]
      );
      res.json({ users: rows });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/request-password-reset', authLimiter, async (req, res) => {
    const { email } = req.body || {};
    try {
      res.json({ message: 'If an account exists for that email, you will receive a reset link.' });
      if (!email || typeof email !== 'string') return;
      const user = await get('SELECT id FROM users WHERE email = ? AND (deleted IS NULL OR deleted = 0)', [email.trim()]);
      if (!user) return;
      const { token } = await createResetTokenForUser(user.id, get, run);
      const resetLink = `${RESET_BASE_URL}?token=${encodeURIComponent(token)}`;
      try {
        const { subject, text, html } = resetPasswordEmail({ resetLink });
        await sendEmail({ to: email.trim(), subject, text, html });
      } catch (mailErr) {
        console.error('[auth] password reset email failed:', mailErr.message);
      }
    } catch (e) {
      console.error('[auth] request-password-reset:', e.message);
    }
  });

  app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    try {
      const userId = await validateResetToken(token, get);
      if (!userId) {
        return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' });
      }
      const user = await get('SELECT deleted FROM users WHERE id = ?', [userId]);
      if (user?.deleted) {
        return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
      await markTokenUsed(token, run);
      res.json({ message: 'Password updated. You can sign in with your new password.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ========================================================
  // Billing Routes
  // ========================================================

  const APP_DEEP_LINK_SCHEME = process.env.APP_DEEP_LINK_SCHEME || 'brewledger';

  // Public redirect for in-app browser: after Stripe checkout success, redirect to app deep link so app can close browser and confirm.
  app.get('/api/billing/success-redirect', (req, res) => {
    const sessionId = req.query.session_id || '';
    const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
    const redirectUrl = `${APP_DEEP_LINK_SCHEME}://billing/success?session_id=${encodeURIComponent(safeId)}`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${redirectUrl.replace(/&/g, '&amp;')}"></head><body><p>Redirecting back to BrewLedger...</p><script>window.location.href=${JSON.stringify(redirectUrl)};</script></body></html>`);
  });

  // Public page for in-app browser: after Stripe Customer Portal "Return to BrewLedger".
  // In-app browsers (SFSafariViewController/Custom Tabs) often do not hand off custom URL schemes to the app,
  // so we show a clear "Close this window" message; the app listens for browserFinished and refreshes.
  app.get('/api/billing/portal-return', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Return to BrewLedger</title></head><body style="font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem;text-align:center;background:#f5f5f5;box-sizing:border-box;"><img src="/logo.png" alt="BrewLedger" style="width:140px;height:140px;object-fit:contain;margin-bottom:2.5rem;"><p style="font-size:2.25rem;font-weight:700;color:#1a1a1a;margin:0 0 1.5rem;line-height:1.2;">You're all set.</p><p style="font-size:1.75rem;color:#444;margin:0;line-height:1.4;">Close this window to return to BrewLedger.</p></body></html>`);
  });

  app.post('/api/billing/create-checkout-session', authMiddleware, async (req, res) => {
    if (!req.app.stripe) {
      return res.status(503).json({ error: 'Billing is not configured (STRIPE_SECRET_KEY)' });
    }
    const { returnUrl, inAppBrowser } = req.body;
    const { orgId } = req.user;
    const baseUrl = returnUrl || process.env.BILLING_RETURN_BASE_URL || 'http://localhost:5173';
    const successPath = inAppBrowser ? '/api/billing/success-redirect' : '/billing/success';
    const successUrl = `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`;

    try {
      const org = await get('SELECT stripe_customer_id FROM orgs WHERE id = ?', [orgId]);
      const sessionConfig = {
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: `${baseUrl}/billing/cancel`,
        metadata: { orgId },
        allow_promotion_codes: true
      };
      if (org && org.stripe_customer_id) {
        sessionConfig.customer = org.stripe_customer_id;
        sessionConfig.customer_update = { name: 'auto', address: 'auto' };
      } else {
        sessionConfig.payment_method_types = ['card'];
      }

      const session = await req.app.stripe.checkout.sessions.create(sessionConfig);
      res.json({ url: session.url });
    } catch (e) {
      console.error('create-checkout-session error', e);
      res.status(500).json({ error: 'Unable to start checkout. Please try again or contact support.' });
    }
  });

  app.post('/api/billing/confirm-subscription', authMiddleware, async (req, res) => {
    if (!req.app.stripe) {
      return res.status(503).json({ error: 'Billing is not configured (STRIPE_SECRET_KEY)' });
    }
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing session ID' });

    try {
      const session = await req.app.stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer', 'subscription'] });
      const orgId = session.metadata?.orgId;
      if (!orgId || orgId !== req.user.orgId) {
        return res.status(403).json({ error: 'Organization mismatch' });
      }
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (!customerId || !subscriptionId) {
        console.warn('Confirm subscription: missing customer or subscription on session', { sessionId, customerId: !!customerId, subscriptionId: !!subscriptionId });
        return res.status(400).json({ error: 'Subscription not ready yet. Please refresh in a moment or check your billing in Settings.' });
      }
      if (session.payment_status === 'paid' || session.status === 'complete') {
        await run('UPDATE orgs SET subscription_plan = ?, subscription_status = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?',
          ['subscription', 'active', customerId, subscriptionId, orgId]);
        res.json({ success: true, plan: 'subscription' });
      } else {
        res.status(400).json({ error: 'Payment not confirmed' });
      }
    } catch (e) {
      console.error('confirm-subscription error', e);
      res.status(500).json({ error: 'Unable to confirm subscription. Please try again or check Settings.' });
    }
  });

  app.post('/api/billing/cancel-subscription', authMiddleware, async (req, res) => {
    if (!req.app.stripe) {
      return res.status(503).json({ error: 'Billing is not configured (STRIPE_SECRET_KEY)' });
    }
    const { orgId } = req.user;

    try {
      const org = await get('SELECT stripe_customer_id, stripe_subscription_id, trial_ends_at FROM orgs WHERE id = ?', [orgId]);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // 1. Cancel in Stripe
      if (org.stripe_subscription_id) {
         await req.app.stripe.subscriptions.cancel(org.stripe_subscription_id);
      } else if (org.stripe_customer_id) {
         // Fallback: list subscriptions
         const subscriptions = await req.app.stripe.subscriptions.list({
           customer: org.stripe_customer_id,
           status: 'active',
           limit: 1
         });
         
         if (subscriptions.data.length > 0) {
           await req.app.stripe.subscriptions.cancel(subscriptions.data[0].id);
         }
      }

      // 2. Determine fallback state
      const now = new Date();
      const trialEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
      let newStatus = 'cancelled';
      const newPlan = 'subscription';
      if (trialEnd && trialEnd > now) newStatus = 'trialing';

      await run('UPDATE orgs SET subscription_status = ?, subscription_plan = ? WHERE id = ?', 
        [newStatus, newPlan, orgId]);

      res.json({ success: true, status: newStatus });
    } catch (e) {
      console.error('cancel-subscription error', e);
      res.status(500).json({ error: 'Unable to cancel subscription. Please try again or contact support.' });
    }
  });

  app.post('/api/billing/create-portal-session', authMiddleware, async (req, res) => {
    if (!req.app.stripe) {
      return res.status(503).json({ error: 'Billing is not configured (STRIPE_SECRET_KEY)' });
    }
    const { returnUrl, inAppBrowser } = req.body;
    const { orgId } = req.user;
    
    // Use client provided return URL or default to localhost
    const baseUrl = returnUrl || process.env.BILLING_RETURN_BASE_URL || 'http://localhost:5173';
    // When opening portal in native in-app browser, return to a server redirect that deep-links back to the app
    const portalReturnPath = inAppBrowser ? '/api/billing/portal-return' : '/settings';
    const portalReturnUrl = `${baseUrl}${portalReturnPath}`;
    
    try {
      const org = await get('SELECT stripe_customer_id, stripe_subscription_id FROM orgs WHERE id = ?', [orgId]);
      
      if (!org || !org.stripe_customer_id) {
        return res.status(400).json({ error: 'No billing account found' });
      }

      const portalConfig = {
        customer: org.stripe_customer_id,
        return_url: portalReturnUrl,
      };

      const session = await req.app.stripe.billingPortal.sessions.create(portalConfig);
      res.json({ url: session.url });
    } catch (e) {
      console.error('create-portal-session error', e);
      res.status(500).json({ error: 'Unable to open billing portal. Please try again or contact support.' });
    }
  });

  // ========================================================
  // Webhooks
  // ========================================================

  // Removed duplicate webhook handler from bottom of file
  // as it is now defined at the top before global body parser

  // ========================================================
  // Item Template Routes (Public - no auth needed for read, auth for import)
  // ========================================================

  // Search item templates
  // ========================================================
  // Organization Settings Routes
  // ========================================================

  app.put('/api/orgs/:orgId/brewery-info', authMiddleware, async (req, res) => {
    const { orgId } = req.params;
    const { userId, orgId: userOrgId } = req.user;

    // Verify user belongs to this org
    if (orgId !== userOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      brewery_name,
      brewery_ein,
      ttb_brewery_number,
      brewery_address_street,
      brewery_address_city,
      brewery_address_county,
      brewery_address_state,
      brewery_address_zip,
      brewery_phone
    } = req.body;

    try {
      // Validate TTB number format if provided (BR-XXXXX)
      if (ttb_brewery_number && !/^BR-\d+$/.test(ttb_brewery_number)) {
        return res.status(400).json({ error: 'TTB brewery number must be in format BR-XXXXX' });
      }

      // Update organization name when brewery_name is provided (editable in Settings)
      if (req.body.hasOwnProperty('brewery_name')) {
        const nameValue = typeof brewery_name === 'string' ? brewery_name.trim() : null;
        await run('UPDATE orgs SET name = ? WHERE id = ?', [nameValue || null, orgId]);
      }

      // Update organization with brewery information
      await run(
        `UPDATE orgs SET 
          brewery_ein = ?,
          ttb_brewery_number = ?,
          brewery_address_street = ?,
          brewery_address_city = ?,
          brewery_address_county = ?,
          brewery_address_state = ?,
          brewery_address_zip = ?,
          brewery_phone = ?
        WHERE id = ?`,
        [
          brewery_ein || null,
          ttb_brewery_number || null,
          brewery_address_street || null,
          brewery_address_city || null,
          brewery_address_county || null,
          brewery_address_state || null,
          brewery_address_zip || null,
          brewery_phone || null,
          orgId
        ]
      );

      // Return updated org data
      const org = await get('SELECT name, brewery_ein, ttb_brewery_number, brewery_address_street, brewery_address_city, brewery_address_county, brewery_address_state, brewery_address_zip, brewery_phone FROM orgs WHERE id = ?', [orgId]);
      res.json({
        brewery_name: org.name || null,
        brewery_ein: org.brewery_ein,
        ttb_brewery_number: org.ttb_brewery_number,
        brewery_address_street: org.brewery_address_street,
        brewery_address_city: org.brewery_address_city,
        brewery_address_county: org.brewery_address_county,
        brewery_address_state: org.brewery_address_state,
        brewery_address_zip: org.brewery_address_zip,
        brewery_phone: org.brewery_phone
      });
    } catch (e) {
      console.error('Error updating brewery info:', e);
      res.status(500).json({ error: 'Failed to update brewery information' });
    }
  });

  app.get('/api/orgs/:orgId/brewery-info', authMiddleware, async (req, res) => {
    const { orgId } = req.params;
    const { orgId: userOrgId } = req.user;

    // Verify user belongs to this org
    if (orgId !== userOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const org = await get('SELECT name, brewery_ein, ttb_brewery_number, brewery_address_street, brewery_address_city, brewery_address_county, brewery_address_state, brewery_address_zip, brewery_phone FROM orgs WHERE id = ?', [orgId]);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      res.json({
        brewery_name: org.name || null,
        brewery_ein: org.brewery_ein || null,
        ttb_brewery_number: org.ttb_brewery_number || null,
        brewery_address_street: org.brewery_address_street || null,
        brewery_address_city: org.brewery_address_city || null,
        brewery_address_county: org.brewery_address_county || null,
        brewery_address_state: org.brewery_address_state || null,
        brewery_address_zip: org.brewery_address_zip || null,
        brewery_phone: org.brewery_phone || null
      });
    } catch (e) {
      console.error('Error fetching brewery info:', e);
      res.status(500).json({ error: 'Failed to fetch brewery information' });
    }
  });

  // ========================================================
  // Item Templates Routes
  // ========================================================

  app.get('/api/item-templates', async (req, res) => {
    try {
      const { page = 1, limit = 50, type_class, category, vendor, q } = req.query;
      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit) || 50, 200); // Max 200
      const offset = (pageNum - 1) * limitNum;

      let sql = 'SELECT * FROM item_templates WHERE 1=1';
      const params = [];

      if (type_class) {
        sql += ' AND type_class = ?';
        params.push(type_class);
      }
      if (category) {
        sql += ' AND category = ?';
        params.push(category);
      }
      if (vendor) {
        sql += ' AND vendor LIKE ?';
        params.push(`%${vendor}%`);
      }
      if (q) {
        sql += ' AND (name LIKE ? OR description LIKE ? OR product_code LIKE ?)';
        const searchTerm = `%${q}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
      const countResult = await get(countSql, params);
      const total = countResult ? countResult.count : 0;

      // Get paginated results
      sql += ' ORDER BY name LIMIT ? OFFSET ?';
      params.push(limitNum, offset);

      const templates = await all(sql, params);

      res.json({
        templates: templates || [],
        total,
        page: pageNum,
        limit: limitNum
      });
    } catch (e) {
      console.error('Error fetching item templates:', e);
      res.status(500).json({ error: 'Failed to fetch item templates' });
    }
  });

  // Get single item template
  app.get('/api/item-templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const template = await get('SELECT * FROM item_templates WHERE id = ?', [id]);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (e) {
      console.error('Error fetching item template:', e);
      res.status(500).json({ error: 'Failed to fetch item template' });
    }
  });

  // Import template to organization items
  app.post('/api/item-templates/import', authMiddleware, async (req, res) => {
    try {
      const { template_id, overrides = {} } = req.body;
      const { orgId } = req.user;
      const now = new Date().toISOString();

      // Get template
      const template = await get('SELECT * FROM item_templates WHERE id = ?', [template_id]);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Create item from template with overrides
      const itemData = {
        name: template.name,
        type_class: overrides.type_class !== undefined ? overrides.type_class : template.type_class,
        category: overrides.category !== undefined ? overrides.category : template.category,
        unit: overrides.unit !== undefined ? overrides.unit : template.unit,
        price: overrides.price !== undefined ? overrides.price : template.price,
        vendor: overrides.vendor !== undefined ? overrides.vendor : template.vendor,
        interval: overrides.interval !== undefined ? overrides.interval : null,
        template_id: template_id
      };

      // Create item entity
      const itemId = uuidv4();
      const itemEntity = {
        id: itemId,
        ...itemData,
        org_id: orgId,
        updated_at: now,
        server_updated_at: now,
        version: 1,
        sync_status: 'synced' // Already on server
      };

      // Insert into items table
      await run(`INSERT INTO items (id, org_id, updated_at, server_updated_at, version, data)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, orgId, now, now, 1, JSON.stringify(itemEntity)]
      );

      res.json({ item: itemEntity });
    } catch (e) {
      console.error('Error importing item template:', e);
      res.status(500).json({ error: 'Failed to import item template' });
    }
  });

  // ========================================================
  // QuickBooks Online Integration
  // ========================================================

  app.get('/api/integrations/qbo/status', authMiddleware, async (req, res) => {
    try {
      const { orgId } = req.user;
      const connection = await getQboConnection(orgId);
      res.json({
        hasClientConfig: !!(qboConfig.clientId && qboConfig.clientSecret),
        connected: !!connection,
        realmId: connection?.realm_id || null,
        expiresAt: connection?.expires_at || null,
        authorizeUrl: qboConfig.clientId && qboConfig.clientSecret ? buildQboAuthUrl() : null
      });
    } catch (e) {
      console.error('QBO status error', e);
      res.status(500).json({ error: 'Failed to get QuickBooks status' });
    }
  });

  app.post('/api/integrations/qbo/authorize-url', authMiddleware, async (req, res) => {
    if (!qboConfig.clientId || !qboConfig.clientSecret) {
      return res.status(400).json({ error: 'QBO_CLIENT_ID/SECRET not configured on server' });
    }
    const state = uuidv4();
    res.json({ url: buildQboAuthUrl(state), state });
  });

  app.post('/api/integrations/qbo/exchange', authMiddleware, async (req, res) => {
    try {
      const { code, realmId } = req.body;
      if (!code || !realmId) return res.status(400).json({ error: 'Missing code or realmId' });
      if (!qboConfig.clientId || !qboConfig.clientSecret) {
        return res.status(400).json({ error: 'QBO_CLIENT_ID/SECRET not configured on server' });
      }

      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('code', code);
      params.append('redirect_uri', qboConfig.redirectUri);

      const resp = await fetch(QBO_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${qboConfig.clientId}:${qboConfig.clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(400).json({ error: `Token exchange failed: ${resp.status} ${text}` });
      }
      const data = await resp.json();
      const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
      await saveQboConnection(req.user.orgId, {
        realm_id: realmId,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_at: expiresAt
      });
      res.json({ connected: true, realmId });
    } catch (e) {
      console.error('QBO exchange error', e);
      res.status(500).json({ error: 'Failed to exchange authorization code' });
    }
  });

  // Simple capture endpoint to surface code/realmId for manual exchange (browser callback)
  app.get('/api/integrations/qbo/callback', (req, res) => {
    const { code, realmId } = req.query;
    res.status(200).send(`
      <html>
        <body style="font-family: sans-serif;">
          <h3>BrewLedger QuickBooks Callback</h3>
          <p>Copy the following values into Distribution → Integrations:</p>
          <p><strong>code:</strong> ${code || '(missing)'}</p>
          <p><strong>realmId:</strong> ${realmId || '(missing)'}</p>
        </body>
      </html>
    `);
  });

  app.post('/api/integrations/qbo/disconnect', authMiddleware, async (req, res) => {
    try {
      await deleteQboConnection(req.user.orgId);
      res.json({ disconnected: true });
    } catch (e) {
      console.error('QBO disconnect error', e);
      res.status(500).json({ error: 'Failed to disconnect QuickBooks' });
    }
  });

  app.get('/api/integrations/qbo/mappings', authMiddleware, async (req, res) => {
    try {
      const mappings = await getQboMappings(req.user.orgId);
      res.json({ mappings });
    } catch (e) {
      console.error('QBO mappings fetch error', e);
      res.status(500).json({ error: 'Failed to fetch mappings' });
    }
  });

  app.post('/api/integrations/qbo/mappings', authMiddleware, async (req, res) => {
    try {
      const { brew_item_id } = req.body;
      if (!brew_item_id) return res.status(400).json({ error: 'brew_item_id is required' });
      const mapping = await upsertQboMapping(req.user.orgId, req.body);
      res.json({ mapping });
    } catch (e) {
      console.error('QBO mapping upsert error', e);
      res.status(500).json({ error: 'Failed to save mapping' });
    }
  });

  // Get first Income account for Item creation (NonInventory requires IncomeAccountRef)
  const getFirstIncomeAccountId = async (connection) => {
    const query = `SELECT * FROM Account WHERE AccountType = 'Income' MAXRESULTS 1`;
    const result = await callQboApi(connection, `/v3/company/${connection.realm_id}/query?query=${encodeURIComponent(query)}`);
    const raw = result?.QueryResponse?.Account;
    const acc = Array.isArray(raw) ? raw[0] : raw;
    return acc?.Id || null;
  };

  // Push a single item to QuickBooks (creates item if missing mapping)
  app.post('/api/integrations/qbo/items/:itemId/push', authMiddleware, async (req, res) => {
    try {
      const { itemId } = req.params;
      const { orgId } = req.user;
      const row = await get('SELECT data FROM items WHERE id = ? AND org_id = ?', [itemId, orgId]);
      if (!row) return res.status(404).json({ error: 'Item not found' });
      const item = JSON.parse(row.data);
      const connection = await ensureQboAccess(orgId);

      const incomeAccountId = await getFirstIncomeAccountId(connection);
      if (!incomeAccountId) {
        return res.status(400).json({ error: 'No Income account found in QuickBooks. Add an Income account in QBO first.' });
      }

      // NonInventory requires IncomeAccountRef; sanitize name for QBO
      const rawName = (item && item.name) ? String(item.name) : 'Beer';
      const name = rawName.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 100) || 'Beer';

      const itemPayload = {
        Name: name,
        Type: 'NonInventory',
        IncomeAccountRef: { value: incomeAccountId }
      };
      const unitPrice = Number(item?.default_unit_cost);
      if (!Number.isNaN(unitPrice) && unitPrice >= 0) {
        itemPayload.UnitPrice = unitPrice;
      }
      const payload = itemPayload;

      console.log('[QBO push item] payload:', JSON.stringify(payload, null, 2));
      const result = await callQboApi(connection, `/v3/company/${connection.realm_id}/item?minorversion=73`, 'POST', payload);
      const qboItemId = result?.Item?.Id || null;
      await upsertQboMapping(orgId, { brew_item_id: itemId, qbo_item_id: qboItemId });
      res.json({ qbo_item_id: qboItemId });
    } catch (e) {
      console.error('[QBO push item] error message:', String(e.message));
      console.error('[QBO push item] fault:', JSON.stringify(e.fault, null, 2));
      res.status(500).json({ error: e.message || 'Failed to push item to QuickBooks' });
    }
  });

  // Push a RECEIVE ledger entry as a Bill into QBO
  app.post('/api/integrations/qbo/push/receive', authMiddleware, async (req, res) => {
    try {
      const { ledger_entry_id } = req.body;
      const { orgId } = req.user;
      if (!ledger_entry_id) return res.status(400).json({ error: 'ledger_entry_id is required' });

      const row = await get('SELECT data FROM ledger_entries WHERE id = ? AND org_id = ?', [ledger_entry_id, orgId]);
      if (!row) return res.status(404).json({ error: 'Ledger entry not found' });
      const entry = JSON.parse(row.data);
      if (entry.type !== 'RECEIVE') return res.status(400).json({ error: 'Only RECEIVE entries can be pushed as Bills' });

      const connection = await ensureQboAccess(orgId);
      const mapping = await get('SELECT * FROM qbo_mappings WHERE org_id = ? AND brew_item_id = ?', [orgId, entry.item_id]);
      if (!mapping || !mapping.qbo_item_id) {
        return res.status(400).json({ error: 'No QBO item mapping for this BrewLedger item' });
      }
      if (!mapping.qbo_vendor_id) {
        return res.status(400).json({ error: 'No QBO vendor mapping provided for this item' });
      }

      const unitCost = entry.unit_cost || entry.default_unit_cost || 0;
      const amount = Math.abs(entry.total_cost != null ? entry.total_cost : (unitCost * (entry.quantity || 0)));
      const txnDate = entry.created_at ? entry.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

      const billPayload = {
          VendorRef: { value: mapping.qbo_vendor_id },
          TxnDate: txnDate,
          PrivateNote: entry.note || 'BrewLedger receipt',
          Line: [
            {
              DetailType: 'ItemBasedExpenseLineDetail',
              Amount: amount,
              Description: entry.item_name || 'Item receipt',
              ItemBasedExpenseLineDetail: {
                ItemRef: { value: mapping.qbo_item_id },
                Qty: Math.abs(entry.quantity || 0),
                UnitPrice: unitCost
              }
            }
          ]
        
      };

      const result = await callQboApi(connection, `/v3/company/${connection.realm_id}/bill?minorversion=73`, 'POST', billPayload);
      const qboBillId = result?.Bill?.Id || null;

      // Persist Bill ID on ledger entry for audit + sync
      entry.qbo_bill_id = qboBillId;
      entry.server_updated_at = new Date().toISOString();
      await run('UPDATE ledger_entries SET data = ?, server_updated_at = ? WHERE id = ?', [JSON.stringify(entry), entry.server_updated_at, entry.id]);

      res.json({ qbo_bill_id: qboBillId, pushed: true });
    } catch (e) {
      console.error('QBO push receive error', e);
      res.status(500).json({ error: e.message || 'Failed to push RECEIVE to QuickBooks' });
    }
  });

  // Fetch QBO customers for Sales Order dropdown (paginated, max 1000 per page)
  app.get('/api/integrations/qbo/customers', authMiddleware, async (req, res) => {
    try {
      const { orgId } = req.user;
      const connection = await ensureQboAccess(orgId);
      const customers = [];
      let startPosition = 1;
      const maxResults = 1000;
      let batch;

      do {
        const query = startPosition === 1
          ? `SELECT * FROM Customer MAXRESULTS ${maxResults}`
          : `SELECT * FROM Customer STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
        const result = await callQboApi(connection, `/v3/company/${connection.realm_id}/query?query=${encodeURIComponent(query)}`);
        const raw = result?.QueryResponse?.Customer;
        batch = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        customers.push(...batch);
        startPosition += maxResults;
      } while (batch.length >= maxResults);

      res.json({ customers });
    } catch (e) {
      console.error('QBO customers error', e);
      res.status(500).json({ error: e.message || 'Failed to fetch QuickBooks customers' });
    }
  });

  // Fetch QBO items for mapping (paginated, max 1000 per page)
  app.get('/api/integrations/qbo/items', authMiddleware, async (req, res) => {
    try {
      const { orgId } = req.user;
      const connection = await ensureQboAccess(orgId);
      const items = [];
      let startPosition = 1;
      const maxResults = 1000;
      let batch;

      do {
        const query = startPosition === 1
          ? `SELECT * FROM Item MAXRESULTS ${maxResults}`
          : `SELECT * FROM Item STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;
        const result = await callQboApi(connection, `/v3/company/${connection.realm_id}/query?query=${encodeURIComponent(query)}`);
        const raw = result?.QueryResponse?.Item;
        batch = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        items.push(...batch);
        startPosition += maxResults;
      } while (batch.length >= maxResults);

      res.json({ items });
    } catch (e) {
      console.error('QBO items error', e);
      res.status(500).json({ error: e.message || 'Failed to fetch QuickBooks items' });
    }
  });

  // Push a CONSUME ledger entry (Sales Order) as an Invoice into QBO
  app.post('/api/integrations/qbo/push/invoice', authMiddleware, async (req, res) => {
    try {
      const { ledger_entry_id } = req.body;
      const { orgId } = req.user;
      if (!ledger_entry_id) return res.status(400).json({ error: 'ledger_entry_id is required' });

      const row = await get('SELECT data FROM ledger_entries WHERE id = ? AND org_id = ?', [ledger_entry_id, orgId]);
      if (!row) return res.status(404).json({ error: 'Ledger entry not found' });
      const entry = JSON.parse(row.data);

      if (entry.type !== 'CONSUME') return res.status(400).json({ error: 'Only CONSUME entries can be pushed as Invoices' });
      if (entry.removal_purpose !== 'sale') return res.status(400).json({ error: 'Only sale removals can be pushed as Invoices' });

      // Idempotency: already synced
      if (entry.qbo_invoice_id) {
        return res.json({ qbo_invoice_id: entry.qbo_invoice_id, pushed: false, already_synced: true });
      }

      if (!entry.qbo_customer_id) return res.status(400).json({ error: 'Customer is required for Invoice sync. Select a QuickBooks customer.' });

      const unitPrice = entry.unit_cost ?? entry.unit_price ?? 0;
      const qty = Math.abs(entry.quantity || 0);
      if (qty <= 0) return res.status(400).json({ error: 'Invalid quantity for Invoice' });

      const connection = await ensureQboAccess(orgId);
      const mapping = await get('SELECT * FROM qbo_mappings WHERE org_id = ? AND brew_item_id = ?', [orgId, entry.item_id]);
      if (!mapping || !mapping.qbo_item_id) {
        return res.status(400).json({ error: 'Map this item in Distribution → Integrations first. No QBO item mapping for this beer.' });
      }

      const txnDate = entry.created_at ? entry.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

      // QBO Invoice: ensure string IDs; round decimals to avoid float parse issues
      const customerId = String(entry.qbo_customer_id);
      const itemId = String(mapping.qbo_item_id);
      const amount = Math.round(unitPrice * qty * 100) / 100;
      const price = Math.round(unitPrice * 100) / 100;

      const invoicePayload = {
          CustomerRef: { value: customerId },
          TxnDate: txnDate,
          PrivateNote: 'BrewLedger Sales Order Export',
          Line: [
            {
              DetailType: 'SalesItemLineDetail',
              Amount: amount,
              SalesItemLineDetail: {
                ItemRef: { value: itemId },
                Qty: qty,
                UnitPrice: price
              }
            }
          ]
        
      };
      if (entry.note) {
        invoicePayload.PrivateNote = String(entry.note).slice(0, 4000);
      }

      console.log('[QBO push invoice] payload:', JSON.stringify(invoicePayload, null, 2));
      const result = await callQboApi(connection, `/v3/company/${connection.realm_id}/invoice?minorversion=73`, 'POST', invoicePayload);
      const qboInvoiceId = result?.Invoice?.Id || null;

      entry.qbo_invoice_id = qboInvoiceId;
      entry.server_updated_at = new Date().toISOString();
      await run('UPDATE ledger_entries SET data = ?, server_updated_at = ? WHERE id = ?', [JSON.stringify(entry), entry.server_updated_at, entry.id]);

      res.json({ qbo_invoice_id: qboInvoiceId, pushed: true });
    } catch (e) {
      console.error('[QBO push invoice] error message:', String(e.message));
      console.error('[QBO push invoice] fault:', JSON.stringify(e.fault, null, 2));
      const status = e.message?.includes('Customer') ? 400 : 500;
      res.status(status).json({
        error: e.message || 'Failed to push Invoice to QuickBooks',
        fault: e.fault ? JSON.stringify(e.fault) : undefined
      });
    }
  });

  // ========================================================
  // State Sync Routes
  // ========================================================

  app.post('/api/locations', authMiddleware, async (req, res) => {
    const { name, stage } = req.body;
    const { orgId } = req.user;
    const now = new Date().toISOString();

    if (!name) return res.status(400).json({ error: 'Missing name' });

    const validStages = ['cellar', 'serving', 'racking_keg', 'bottling_bulk', 'case'];
    const stageValue = validStages.includes(stage) ? stage : 'cellar';

    try {
      const currentCount = await countActiveLocations(orgId);
      const maxLocations = await getOrgMaxLocations(orgId);

      if (currentCount >= maxLocations) {
        return res.status(403).json({ error: `Location limit reached. Maximum allowed: ${maxLocations}` });
      }

      const id = uuidv4();
      const newLocation = {
        id,
        org_id: orgId,
        name,
        stage: stageValue,
        created_at: now,
        updated_at: now,
        server_updated_at: now,
        sync_status: 'synced',
        version: 1
      };

      const dataJson = JSON.stringify(newLocation);

      await run(`INSERT INTO locations (id, org_id, updated_at, server_updated_at, version, data) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, orgId, now, now, 1, dataJson]);

      res.status(201).json(newLocation);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ========================================================
  // Serving / Inventory Reports (server-side, long range)
  // ========================================================
  app.get('/api/reports/serving', authMiddleware, async (req, res) => {
    const { orgId } = req.user;
    const { periodStart, periodEnd } = req.query;
    const start = periodStart ? new Date(periodStart).toISOString() : null;
    const end = periodEnd ? new Date(periodEnd).toISOString() : null;
    const inRange = (date) => {
      if (!date) return false;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    };
    const safeParse = (data) => {
      try { return JSON.parse(data); } catch (e) { return null; }
    };
    try {
      const ledgerRows = await all('SELECT data FROM ledger_entries WHERE org_id = ?', [orgId]);
      const itemRows = await all('SELECT data FROM items WHERE org_id = ?', [orgId]);
      const locationRows = await all('SELECT data FROM locations WHERE org_id = ?', [orgId]);
      const batchRows = await all('SELECT data FROM batches WHERE org_id = ?', [orgId]);
      const batchLocationRows = await all('SELECT data FROM batch_locations WHERE org_id = ?', [orgId]);
      const vesselRows = await all('SELECT data FROM vessels WHERE org_id = ?', [orgId]);
      const onhandRows = await all('SELECT item_id, location_id, quantity FROM onhand_cache WHERE org_id = ?', [orgId]);

      const ledger = ledgerRows.map(r => safeParse(r.data)).filter(Boolean);
      const items = itemRows.map(r => safeParse(r.data)).filter(Boolean);
      const locations = locationRows.map(r => safeParse(r.data)).filter(Boolean);
      const batches = batchRows.map(r => safeParse(r.data)).filter(Boolean);
      const batchLocations = batchLocationRows.map(r => safeParse(r.data)).filter(Boolean);
      const vessels = vesselRows.map(r => safeParse(r.data)).filter(Boolean);

      const itemMap = new Map(items.map(i => [i.id, i]));
      const locationMap = new Map(locations.map(l => [l.id, l]));
      const vesselMap = new Map(vessels.map(v => [v.id, v]));

      // Brewed volume by location (RECEIVE with batch_id)
      const brewedByLocation = [];
      const brewMap = new Map();
      ledger.filter(e => e.type === 'RECEIVE' && e.batch_id && ((!start && !end) || inRange(e.created_at))).forEach(e => {
        const key = e.location_id || 'unspecified';
        const loc = locationMap.get(e.location_id);
        const current = brewMap.get(key) || { location_id: key, location_name: loc?.name || 'Unspecified', quantity: 0 };
        current.quantity += Number(e.quantity) || 0;
        brewMap.set(key, current);
      });
      brewMap.forEach(v => brewedByLocation.push(v));

      // Inventory change by batch and brand
      const changeByBatch = new Map();
      const changeByBrand = new Map();
      ledger.filter(e => ((!start && !end) || inRange(e.created_at))).forEach(e => {
        if (e.batch_id) {
          const cur = changeByBatch.get(e.batch_id) || { batch_id: e.batch_id, batch_name: batches.find(b => b.id === e.batch_id)?.name || 'Batch', quantity: 0 };
          cur.quantity += Number(e.quantity) || 0;
          changeByBatch.set(e.batch_id, cur);
        }
        if (e.item_id) {
          const item = itemMap.get(e.item_id);
          const cur = changeByBrand.get(e.item_id) || { item_id: e.item_id, item_name: item?.name || 'Item', quantity: 0 };
          cur.quantity += Number(e.quantity) || 0;
          changeByBrand.set(e.item_id, cur);
        }
      });

      // Bulk on hand by vessel (current batch_location volumes)
      const bulkOnhand = [];
      const bulkMap = new Map();
      batchLocations.forEach(bl => {
        const vessel = vesselMap.get(bl.vessel_id);
        const key = bl.vessel_id || 'unknown';
        const cur = bulkMap.get(key) || { vessel_id: key, vessel_name: vessel?.name || 'Vessel', type: vessel?.type || '', quantity: 0 };
        cur.quantity += Number(bl.current_volume) || 0;
        bulkMap.set(key, cur);
      });
      bulkMap.forEach(v => bulkOnhand.push(v));

      // Packaged inventory by cold storage location (Finished Beer items)
      const packaged = [];
      const packagedMap = new Map();
      onhandRows.forEach(row => {
        const item = itemMap.get(row.item_id);
        if (!item || item.category !== 'Finished Beer') return;
        const loc = locationMap.get(row.location_id);
        const key = row.location_id || 'unspecified';
        const cur = packagedMap.get(key) || { location_id: key, location_name: loc?.name || 'Unspecified', quantity: 0 };
        cur.quantity += Number(row.quantity) || 0;
        packagedMap.set(key, cur);
      });
      packagedMap.forEach(v => packaged.push(v));

      res.json({
        brewed_by_location: brewedByLocation,
        inventory_change: {
          byBatch: Array.from(changeByBatch.values()),
          byBrand: Array.from(changeByBrand.values())
        },
        bulk_onhand_by_vessel: bulkOnhand,
        packaged_by_location: packaged
      });
    } catch (e) {
      console.error('Serving report error', e);
      res.status(500).json({ error: 'Failed to build report' });
    }
  });

  app.post('/api/sync', authMiddleware, async (req, res) => {
    const { changes, lastSyncTimestamp } = req.body;
    const { orgId } = req.user; // from middleware, mapped to camelCase
    const now = new Date().toISOString();

    // Helper to process upserts
    const processChange = async (table, entity, type) => {
      // 1. Validate
      const isValid = await validateEntity(type, entity, orgId);
      if (!isValid) {
        console.warn(`Invalid ${type} received from user ${req.user.userId}`, entity);
        return;
      }

      // 2. Authoritative Timestamp
      entity.server_updated_at = now;
      
      // Check existing record for optimistic locking and limit enforcement
      const existingRow = await get(`SELECT version, data FROM ${table} WHERE id = ? AND org_id = ?`, [entity.id, orgId]);
      let existingEntity = null;
      if (existingRow) {
        try {
          existingEntity = JSON.parse(existingRow.data);
        } catch (e) {}
      }
      
      // Location limit enforcement (for new locations and undeletes)
      if (type === 'location') {
        const isNew = !existingRow;
        const isUndelete = existingEntity && existingEntity.deleted_at && !entity.deleted_at;
        if (isNew || isUndelete) {
          const currentCount = await countActiveLocations(orgId);
          const maxLocations = await getOrgMaxLocations(orgId);
          if (currentCount >= maxLocations) {
            console.warn(`Location limit reached for org ${orgId}. Max: ${maxLocations}, Current: ${currentCount}. Rejecting ${isNew ? 'new' : 'undeleted'} location ${entity.id}.`);
            return; // reject
          }
        }
      }

      // Category: do not allow soft-delete of Finished Beer (TTB required)
      if (type === 'category' && entity.deleted_at) {
        const name = (existingEntity && existingEntity.name) || entity.name;
        const isSystem = (existingEntity && existingEntity.is_system) || entity.is_system;
        if (name === 'Finished Beer' || isSystem === true) {
          console.warn(`Rejecting delete of TTB-required category ${entity.id} (Finished Beer or system).`);
          return; // reject
        }
      }

      // Item: do not allow soft-delete of the default Finished Beer item (TTB required)
      if (type === 'item' && entity.deleted_at) {
        const category = (existingEntity && existingEntity.category) || entity.category;
        const name = (existingEntity && existingEntity.name) || entity.name;
        if (category === 'Finished Beer' && name === 'Finished Beer') {
          console.warn(`Rejecting delete of TTB-required default item ${entity.id} (Finished Beer).`);
          return; // reject
        }
      }

      // Idempotency check for ledger/batch_volume_adjustment
      if (type === 'ledger' && entity.client_request_id) {
        const dup = await get('SELECT id FROM ledger_entries WHERE client_request_id = ?', [entity.client_request_id]);
        if (dup) {
          console.warn(`Duplicate ledger client_request_id ${entity.client_request_id} ignored`);
          return;
        }
      }
      if (type === 'batch_volume_adjustment' && entity.client_request_id) {
        const dup = await get('SELECT id FROM batch_volume_adjustments WHERE client_request_id = ?', [entity.client_request_id]);
        if (dup) {
          console.warn(`Duplicate batch_volume_adjustment client_request_id ${entity.client_request_id} ignored`);
          return;
        }
      }

      // 3. Optimistic Locking
      if (existingRow) {
        const incomingVersion = entity.version || 0;
        const existingVersion = existingRow.version || 0;
        
        if (incomingVersion <= existingVersion) {
          console.warn(`Stale update rejected for ${type} ${entity.id}. Server: v${existingVersion}, Client: v${incomingVersion}`);
          return; // REJECT
        }
      }

      // 4. Clamping Future Dates
      if (entity.updated_at > now) entity.updated_at = now;

      // 5. Upsert
      // We store the full entity JSON in 'data' column
      const dataJson = JSON.stringify(entity);
      
      if (type === 'ledger') {
        // Ledger is append-only logic generally, but if ID exists we ignore (idempotency)
        // But here we are treating it like others for simplicity of 'sync'
        // We need specific columns for ledger
        
        // Check if entry already exists to avoid double-counting in cache
        const existingLedger = await get('SELECT id FROM ledger_entries WHERE id = ?', [entity.id]);
        
        await run(`INSERT OR REPLACE INTO ${table} 
          (id, org_id, item_id, location_id, batch_id, transfer_group_id, reversal_group_id, reversed_of_ledger_id, client_request_id, created_at, server_updated_at, version, data)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [entity.id, orgId, entity.item_id, entity.location_id, entity.batch_id || null, entity.transfer_group_id || null, entity.reversal_group_id || null, entity.reversed_of_ledger_id || null, entity.client_request_id || null, entity.created_at, now, entity.version, dataJson]
        );

        // Update Cache Incrementally
        if (!existingLedger && entity.item_id && entity.location_id && typeof entity.quantity === 'number') {
          const cacheKey = [orgId, entity.item_id, entity.location_id];
          
          // Try to get existing cache
          const currentCache = await get('SELECT quantity FROM onhand_cache WHERE org_id = ? AND item_id = ? AND location_id = ?', cacheKey);
          
          const newQuantity = (currentCache ? currentCache.quantity : 0) + entity.quantity;
          
          await run(`INSERT OR REPLACE INTO onhand_cache (org_id, item_id, location_id, quantity, last_updated) VALUES (?, ?, ?, ?, ?)`,
            [orgId, entity.item_id, entity.location_id, newQuantity, now]);
        }

      } else if (type === 'batch_volume_adjustment') {
        await run(`INSERT OR REPLACE INTO ${table} 
          (id, org_id, updated_at, server_updated_at, version, data, client_request_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [entity.id, orgId, entity.updated_at, now, entity.version, dataJson, entity.client_request_id || null]
        );
      } else {
        await run(`INSERT OR REPLACE INTO ${table} 
          (id, org_id, updated_at, server_updated_at, version, data)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [entity.id, orgId, entity.updated_at, now, entity.version, dataJson]
        );
      }
    };

    // 1. Process Incoming Changes
    if (changes) {
      if (changes.items) {
        for (const i of changes.items) await processChange('items', i, 'item');
      }
      if (changes.locations) {
        for (const l of changes.locations) await processChange('locations', l, 'location');
      }
      if (changes.batches) {
        for (const b of changes.batches) await processChange('batches', b, 'batch');
      }
      if (changes.count_sessions) {
        for (const s of changes.count_sessions) await processChange('count_sessions', s, 'count_session');
      }
      if (changes.ledger_entries) {
        for (const e of changes.ledger_entries) await processChange('ledger_entries', e, 'ledger');
      }
      // New Feature Types
      if (changes.vessels) {
        for (const v of changes.vessels) await processChange('vessels', v, 'vessel');
      }
      if (changes.categories) {
        for (const c of changes.categories) await processChange('categories', c, 'category');
      }
      if (changes.batch_additions) {
        for (const a of changes.batch_additions) await processChange('batch_additions', a, 'batch_addition');
      }
      if (changes.batch_readings) {
        for (const r of changes.batch_readings) await processChange('batch_readings', r, 'batch_reading');
      }
      if (changes.packaging_runs) {
        for (const p of changes.packaging_runs) await processChange('packaging_runs', p, 'packaging_run');
      }
      if (changes.variance_events) {
        for (const v of changes.variance_events) await processChange('variance_events', v, 'variance_event');
      }
      if (changes.par_levels) {
        for (const p of changes.par_levels) await processChange('par_levels', p, 'par_level');
      }
      if (changes.allocations) {
        for (const a of changes.allocations) await processChange('allocations', a, 'allocation');
      }
      if (changes.recipes) {
        for (const r of changes.recipes) await processChange('recipes', r, 'recipe');
      }
      if (changes.recipe_items) {
        for (const ri of changes.recipe_items) await processChange('recipe_items', ri, 'recipe_item');
      }
      if (changes.milestone_templates) {
        for (const mt of changes.milestone_templates) await processChange('milestone_templates', mt, 'milestone_template');
      }
      if (changes.batch_milestones) {
        for (const bm of changes.batch_milestones) await processChange('batch_milestones', bm, 'batch_milestone');
      }
      if (changes.batch_locations) {
        for (const bl of changes.batch_locations) await processChange('batch_locations', bl, 'batch_location');
      }
      if (changes.batch_volume_adjustments) {
        for (const bva of changes.batch_volume_adjustments) await processChange('batch_volume_adjustments', bva, 'batch_volume_adjustment');
      }
      if (changes.batch_volume_snapshots) {
        for (const bvs of changes.batch_volume_snapshots) await processChange('batch_volume_snapshots', bvs, 'batch_volume_snapshot');
      }
      if (changes.batch_location_transfers) {
        for (const blt of changes.batch_location_transfers) await processChange('batch_location_transfers', blt, 'batch_location_transfer');
      }
    }

    // 2. Collect Updates for Client
    const responseUpdates = {
      items: [],
      locations: [],
      batches: [],
      count_sessions: [],
      ledger_entries: [],
      vessels: [],
      categories: [],
      batch_additions: [],
      batch_readings: [],
      packaging_runs: [],
      variance_events: [],
      par_levels: [],
      allocations: [],
      recipes: [],
      recipe_items: [],
      milestone_templates: [],
      batch_milestones: [],
      batch_locations: [],
      batch_volume_adjustments: [],
      batch_volume_snapshots: [],
      batch_location_transfers: []
    };

    const fetchUpdates = async (table, targetArray, limit = null) => {
      let sql = `SELECT data, server_updated_at FROM ${table} WHERE org_id = ?`;
      const params = [orgId];

      if (lastSyncTimestamp) {
        sql += ` AND server_updated_at > ?`;
        params.push(lastSyncTimestamp);
      }
      
      // For ledger, we want to order by created_at desc to get latest
      if (limit && table === 'ledger_entries') {
          sql += ` ORDER BY created_at DESC LIMIT ?`;
          params.push(limit);
      }

      const rows = await all(sql, params);
      rows.forEach(row => {
        if (row.data) {
          try {
            const entity = JSON.parse(row.data);
            // Ensure server_updated_at is in the object we return
            entity.server_updated_at = row.server_updated_at;
            targetArray.push(entity);
          } catch (e) {
            console.error('Failed to parse JSON for row', row);
          }
        }
      });
    };

    await fetchUpdates('items', responseUpdates.items);
    await fetchUpdates('locations', responseUpdates.locations);
    await fetchUpdates('batches', responseUpdates.batches);
    await fetchUpdates('count_sessions', responseUpdates.count_sessions);
    // Limit ledger to last 100 entries if this is a fresh sync (no lastSyncTimestamp) or just always?
    // User asked: "only pull down the last 100"
    // If we have lastSyncTimestamp, we should pull *all new* entries to keep history contiguous if client has history.
    // BUT user said "In the application, I only want the ledger page to load the last 100 enteries" AND "I want it to only pull down the last 100".
    // This implies even on fresh sync.
    await fetchUpdates('ledger_entries', responseUpdates.ledger_entries, 100);
    
    await fetchUpdates('vessels', responseUpdates.vessels);
    await fetchUpdates('categories', responseUpdates.categories);
    await fetchUpdates('batch_additions', responseUpdates.batch_additions);
    await fetchUpdates('batch_readings', responseUpdates.batch_readings);
    await fetchUpdates('packaging_runs', responseUpdates.packaging_runs);
    await fetchUpdates('variance_events', responseUpdates.variance_events);
    await fetchUpdates('par_levels', responseUpdates.par_levels);
    await fetchUpdates('allocations', responseUpdates.allocations);
    await fetchUpdates('recipes', responseUpdates.recipes);
    await fetchUpdates('recipe_items', responseUpdates.recipe_items);
    await fetchUpdates('milestone_templates', responseUpdates.milestone_templates);
    await fetchUpdates('batch_milestones', responseUpdates.batch_milestones);
    await fetchUpdates('batch_locations', responseUpdates.batch_locations);
    await fetchUpdates('batch_volume_adjustments', responseUpdates.batch_volume_adjustments);
    await fetchUpdates('batch_volume_snapshots', responseUpdates.batch_volume_snapshots);
    await fetchUpdates('batch_location_transfers', responseUpdates.batch_location_transfers);

    // 3. Calculate Inventory Snapshot (Server-Side)
    // Use cached table for performance
    const snapshot = [];
    try {
      const cacheRows = await all('SELECT item_id, location_id, quantity FROM onhand_cache WHERE org_id = ?', [orgId]);
      cacheRows.forEach(row => {
        snapshot.push({ item_id: row.item_id, location_id: row.location_id, quantity: row.quantity });
      });
    } catch (e) {
      console.error('Failed to retrieve snapshot', e);
    }

    // 4. Fetch Latest Org Status (for billing/trial sync)
    const org = await get('SELECT subscription_plan, subscription_status, trial_ends_at FROM orgs WHERE id = ?', [orgId]);

    res.json({
      updates: responseUpdates,
      inventory_snapshot: snapshot,
      serverTimestamp: now,
      orgStatus: org ? {
        subscriptionPlan: org.subscription_plan,
        subscriptionStatus: org.subscription_status,
        trialEndsAt: org.trial_ends_at
      } : null
    });
  });

  // ========================================================
  // AI Assistant Endpoint
  // ========================================================

  // Comprehensive system prompt preset for Brewster (BrewLedger) expert AI assistant
  const AI_SYSTEM_PROMPT = `You are an AI assistant for BrewLedger, a local-first brewery inventory management system.

## CRITICAL RULES
1. **NEVER HALLUCINATE**: Only mention features that actually exist in BrewLedger. If you're unsure about a feature, say "I'm not certain about that feature" rather than making something up.
2. **OPERATIONS FIRST**: Default to taking action via tool JSON; only give explanations when the user clearly asks for information.
3. **BE CONCISE**: Minimal text; prefer structured JSON + short summaries. Avoid long guidance.
4. **PROCEDURAL PROMPTS**: If info is missing, ask one short follow-up with buttons/choices; otherwise emit the action JSON.

## Output modes
- Default: respond with compact JSON tool calls; only provide explanatory text when the user explicitly asks for information.
- When the user requests an operation (inventory edit/create, par levels, count sessions, batch I/O, packaging, forecast, batch creation from recipe, add ingredient to batch), respond **only** with compact JSON (no prose) using this shape: {"intent":"<intent>","params":{...},"title":"<short title>","summary":"<one-line summary>"}.
- Supported intents: set_par_level, adjust_onhand, transfer_inventory, record_batch_reading, adjust_batch_volume, forecast_item, update_batch_status, transfer_split, combine_splits, create_batch_from_recipe, add_batch_addition, create_item, create_location, start_count_session, close_count_session, create_packaging_run. Prefer IDs when provided; include names in params when available.
- If required fields are missing (e.g., location, vessel, recipe, item, batch, quantity), STILL emit the JSON with the fields you have and note missing pieces in summary (e.g., "need location"). Do NOT say you cannot access user data; the UI will prompt with options.
- Map phrasing: "receive/add" => adjust_onhand with positive quantity; "remove/use/consume" => adjust_onhand with negative quantity; "transfer/move" => transfer_inventory with from/to; "split/transfer vessels" => transfer_split; "combine vessels" => combine_splits; "mark batch status" => update_batch_status; "start/make a batch from recipe" => create_batch_from_recipe (include recipe, vessel, volume); "add ingredient to batch" => add_batch_addition (batch, item, quantity, location); "create item" => create_item (name, category); "create location" => create_location (name, stage); "start/finish count" => start_count_session / close_count_session (location, counts); "packaging run" => create_packaging_run (batch, volume, package info).

## System Overview
BrewLedger is a local-first brewery inventory management application with offline operation and multi-device synchronization. It features inventory tracking, batch management, billing integration, and real-time sync.

## Core Features (ONLY mention these - do not invent others)

### Inventory Management
- Items (ingredients, packaging, equipment, cleaning supplies)
- Locations (storage areas)
- Item Templates (importable from global library)
- Categories (malt/grain, hops, yeast, packaging, equipment, cleaning, other)
- Par Levels (minimum stock thresholds)
- On-Hand quantities (calculated from ledger)

### Ledger System
- Transaction types: RECEIVE, CONSUME, TRANSFER_IN/OUT, COUNT_ADJUST, REVERSAL, CORRECTION
- Immutable transaction history
- Real-time inventory calculations

### Batch Management
- Batch lifecycle tracking
- Statuses: Active, Fermenting, Conditioning, Packaging, Packaged, Closed
- Milestones: KNOCKOUT, PITCHED, FERMENTATION_START, FG_CONFIRMED, COLD_CRASH, TRANSFERRED, SERVING, PACKAGING_START, PACKAGING_COMPLETE, RELEASED, CLOSED
- Batch additions, readings, packaging runs
- Hidden milestones feature

### Recipe System
- Recipes with ingredient lists
- Apply recipes to batches

### Location & Vessel Management
- Locations (subscription-limited: Essential 3, Standard 10, Growth unlimited)
- Vessels (fermenters, brite tanks)
- Count sessions for physical inventory

### Sync & Multi-Device
- Automatic sync every 30 seconds
- Offline support with queued changes
- Conflict resolution (last-write-wins)

### Billing & Subscriptions
- Plans: Essential, Standard, Growth
- 30-day trial period
- Stripe integration

### Reporting
- Dashboard with overview metrics
- Inventory and ledger views
- CSV export

## Response Style
- Keep responses brief and general (2-4 sentences typically)
- Provide conceptual guidance, not detailed steps
- If asked about a feature you're unsure exists, acknowledge uncertainty
- Focus on "what" and "why", not detailed "how-to" instructions
- When users ask "how do I...", give a general overview of the feature rather than step-by-step instructions

## Important Constraints
- Local-first: changes happen immediately locally, sync to server automatically
- Offline-capable: works offline, syncs when online
- Organization-scoped: users only see their organization's data
- Ledger is immutable: use reversals/corrections, never edit directly

Be helpful, concise, and accurate. Only discuss features that exist.`;

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  const OPENROUTER_PRESET = process.env.OPENROUTER_PRESET || '';

  const openaiClient = OPENROUTER_API_KEY ? new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'http://localhost:5174',
      'X-Title': process.env.OPENROUTER_X_TITLE || 'Brewster Console',
    },
  }) : null;

  /**
   * Attempt to extract a structured action payload from a model response.
   * Supports ```json fenced blocks or the first JSON object found in the text.
   */
  const tryParseAction = (text = '') => {
    if (!text) return { action: null, error: null };
    const errors = [];
    const attempts = [];

    const trimmed = text.trim();
    const codeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
    if (codeBlockMatch) attempts.push(codeBlockMatch[1].trim());
    if (trimmed.startsWith('{')) attempts.push(trimmed);

    // Find first "{" and last "}" to try a loose slice
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      attempts.push(trimmed.slice(firstBrace, lastBrace + 1));
    }

    for (const candidate of attempts) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === 'object' && parsed.intent) {
          return { action: parsed, error: null };
        }
      } catch (e) {
        errors.push(e.message);
      }
    }

    return { action: null, error: errors.length ? errors[0] : null };
  };

  // AI chat endpoint with OpenRouter preset support
  app.post('/api/ai/chat', authMiddleware, async (req, res) => {
    try {
      // Check if OpenAI client is configured
      if (!openaiClient || !OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'sk-or-v1-your-openrouter-api-key-here') {
        return res.status(503).json({ 
          error: 'AI assistant is not configured. Please set the OpenRouter API key in server.js' 
        });
      }

      const { message, conversationHistory = [] } = req.body;

      // Validate message
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
      }

      // Build messages array for OpenAI API with comprehensive system prompt
      const messages = [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message.trim() }
      ];

      // Use OpenRouter model (default to GPT-4, can be overridden)
      const model = process.env.OPENROUTER_MODEL || OPENROUTER_PRESET || 'openai/gpt-4o-mini';

      // Call OpenAI API via OpenRouter with preset context
      const completion = await openaiClient.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.4, // Lower to reduce drift
        max_tokens: 700, // Slightly higher to avoid truncation of JSON
      });

      let aiResponse = completion.choices[0]?.message?.content || '';
      let { action, error: actionParseError } = tryParseAction(aiResponse);

      // Heuristic fallback: if the model returned nothing or no action, synthesize a minimal action so the UI can proceed.
      if ((!aiResponse.trim() || !action) && message) {
        const lower = (message || '').toLowerCase();
        if ((lower.includes('add') || lower.includes('create')) && lower.includes('item')) {
          action = {
            intent: 'create_item',
            params: {},
            title: 'Create Item',
            summary: 'Provide item name and category',
          };
        } else if ((lower.includes('add') || lower.includes('create')) && lower.includes('location')) {
          action = {
            intent: 'create_location',
            params: {},
            title: 'Create Location',
            summary: 'Provide location name and stage',
          };
        } else if (lower.includes('start') && lower.includes('batch')) {
          action = {
            intent: 'create_batch_from_recipe',
            params: {},
            title: 'Start Batch',
            summary: 'Select recipe (or skip), vessel, and volume',
          };
        } else if (lower.includes('packag')) {
          action = {
            intent: 'create_packaging_run',
            params: {},
            title: 'Packaging Run',
            summary: 'Select batch and packaged volume',
          };
        } else if (lower.includes('count')) {
          action = {
            intent: 'start_count_session',
            params: {},
            title: 'Start Count Session',
            summary: 'Select location for count session',
          };
        } else if (lower.includes('receive') || (lower.includes('add') && (lower.includes('inventory') || lower.includes('stock')))) {
          action = {
            intent: 'adjust_onhand',
            params: {},
            title: 'Receive / Add Inventory',
            summary: 'Select item, location, and quantity',
          };
        } else if (lower.includes('transfer') && (lower.includes('inventory') || lower.includes('item') || lower.includes('move'))) {
          action = {
            intent: 'transfer_inventory',
            params: {},
            title: 'Transfer Inventory',
            summary: 'Select item, from/to locations, and quantity',
          };
        } else if (lower.includes('par') || lower.includes('reorder') || lower.includes('minimum')) {
          action = {
            intent: 'set_par_level',
            params: {},
            title: 'Set Par Level',
            summary: 'Select item, location (or global), and min quantity',
          };
        } else if (lower.includes('ingredient') && (lower.includes('batch') || lower.includes('add'))) {
          action = {
            intent: 'add_batch_addition',
            params: {},
            title: 'Add Ingredient to Batch',
            summary: 'Select batch, item, location, and quantity',
          };
        }
        // When we synthesize, keep response empty so UI shows the action card only.
        aiResponse = action ? '' : 'Need more details to proceed.';
      }

      res.json({
        response: aiResponse || 'I could not generate a response.',
        model: model,
        preset: OPENROUTER_PRESET,
        action: action || null,
        actionError: actionParseError || null,
      });

    } catch (error) {
      console.error('AI Assistant Error:', error);
      
      // Handle specific error types
      if (error.status === 401 || error.response?.status === 401) {
        return res.status(401).json({ error: 'Invalid OpenRouter API key. Please check the API key configuration in server.js' });
      }
      
      if (error.status === 429 || error.response?.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
      }

      // Generic error response
      res.status(500).json({ 
        error: 'Failed to get AI response. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Static: serve files from STATIC_DIR (assets, etc.). Then non-API GET: serve path/index.html if it exists, else global index.html.
  const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, 'public');
  app.use(express.static(STATIC_DIR));
  app.get(/^\/(?!api)/, (req, res, next) => {
    const rawPath = (req.path || '/').replace(/^\/+/, '').replace(/\.\./g, '');
    const pathIndexHtml = path.join(STATIC_DIR, rawPath, 'index.html');
    const resolved = path.resolve(pathIndexHtml);
    const root = path.resolve(STATIC_DIR);
    if (resolved.startsWith(root) && fs.existsSync(resolved)) {
      return res.sendFile(resolved, (err) => { if (err) next(err); });
    }
    res.sendFile(path.join(STATIC_DIR, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  // Global error handler: catch unhandled errors and async rejections passed via next(err)
  app.use((err, req, res, next) => {
    console.error('Unhandled error', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
  });

  return app;
}

// ========================================================
// Start Server
// ========================================================
// When run directly (node server.js): use HTTPS if Let's Encrypt certs exist, else HTTP.

const TLS_KEY_PATH = process.env.TLS_KEY_PATH || '';
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || '';

if (require.main === module) {
  const app = createApp();
  const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'database.sqlite');
  const host = process.env.HOST || '0.0.0.0';

  let tls;
  try {
    if (TLS_KEY_PATH && TLS_CERT_PATH && fs.existsSync(TLS_KEY_PATH) && fs.existsSync(TLS_CERT_PATH)) {
      tls = {
        key: fs.readFileSync(TLS_KEY_PATH),
        cert: fs.readFileSync(TLS_CERT_PATH),
      };
    }
  } catch (e) {
    console.warn('TLS cert read failed, falling back to HTTP:', e.message);
  }

  const staticDir = process.env.STATIC_DIR || path.join(__dirname, 'public');
  if (tls) {
    https.createServer(tls, app).listen(PORT, host, () => {
      console.log(`HTTPS server listening on https://${host}:${PORT}`);
      console.log(`Serving static from: ${staticDir}`);
      console.log(`Using SQLite database at ${dbPath}`);
    });
  } else {
    app.listen(PORT, host, () => {
      console.log(`Backend running on http://${host}:${PORT}`);
      console.log(`Serving static from: ${staticDir}`);
      console.log(`Using SQLite database at ${dbPath}`);
    });
  }
}

module.exports = createApp;
