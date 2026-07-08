/**
 * Auth middleware and helpers.
 * Expects get and run from db (passed via ctx).
 */

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

/**
 * Generate a random token for sessions
 * @returns {string}
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create auth middleware that validates Bearer token and sets req.user
 * @param {(sql: string, params?: any[]) => Promise<any>} get
 * @param {(sql: string, params?: any[]) => Promise<import('sqlite3').RunResult>} run
 * @returns {import('express').RequestHandler}
 */
function authMiddleware(get, run) {
  return async (req, res, next) => {
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
        await run('DELETE FROM sessions WHERE token = ?', [token]);
        return res.status(401).json({ error: 'Token expired' });
      }

      const user = await get('SELECT deleted FROM users WHERE id = ?', [session.user_id]);
      if (user?.deleted) return res.status(401).json({ error: 'Invalid or expired token' });

      req.user = session;
      req.user.userId = session.user_id;
      req.user.orgId = session.org_id;
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Database error' });
    }
  };
}

/**
 * Rate limiter for auth endpoints (login, register, password reset)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many login attempts, please try again later' },
});

module.exports = {
  generateToken,
  authMiddleware,
  authLimiter,
};
