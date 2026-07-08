/**
 * Password reset token helpers. Expects get/run from server db.
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const EXPIRY_HOURS = 1;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * @param {string} userId
 * @param {function} get - db.get(sql, params)
 * @param {function} run - db.run(sql, params)
 * @returns {Promise<{ token: string, expiresAt: string }>}
 */
async function createResetTokenForUser(userId, get, run) {
  const id = uuidv4();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const createdAt = now.toISOString();
  await run(
    'INSERT INTO password_resets (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, userId, token, expiresAt, createdAt]
  );
  return { token, expiresAt };
}

/**
 * @param {string} token
 * @param {function} get
 * @returns {Promise<string|null>} user_id or null
 */
async function validateResetToken(token, get) {
  const row = await get('SELECT user_id, expires_at, used_at FROM password_resets WHERE token = ?', [token]);
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at) <= new Date()) return null;
  return row.user_id;
}

/**
 * @param {string} token
 * @param {function} run
 */
async function markTokenUsed(token, run) {
  const now = new Date().toISOString();
  await run('UPDATE password_resets SET used_at = ? WHERE token = ?', [now, token]);
}

module.exports = { createResetTokenForUser, validateResetToken, markTokenUsed };
