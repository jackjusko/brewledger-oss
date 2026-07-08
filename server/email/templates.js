/**
 * Email templates (text + HTML) for welcome, invite, and password reset.
 */

function welcomeEmail({ userName, orgName }) {
  const name = userName || 'there';
  const org = orgName || 'your organization';
  return {
    subject: 'Welcome to BrewLedger',
    text: `Hi ${name},\n\nWelcome to BrewLedger. Your organization "${org}" is set up. Sign in at the console to get started with inventory, batches, and reporting.\n\n— BrewLedger`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5;color:#333;"><p>Hi ${escapeHtml(name)},</p><p>Welcome to BrewLedger. Your organization <strong>${escapeHtml(org)}</strong> is set up. Sign in at the console to get started with inventory, batches, and reporting.</p><p>— BrewLedger</p></body></html>`
  };
}

function inviteEmail({ orgName, inviteeName, inviteeEmail, temporaryPassword, loginUrl }) {
  const name = inviteeName || inviteeEmail || 'there';
  const org = orgName || 'your organization';
  const url = loginUrl || 'https://app.example.com/login';
  return {
    subject: "You've been invited to BrewLedger",
    text: `Hi ${name},\n\nYou've been invited to join "${org}" on BrewLedger. Sign in with this email and the temporary password below, then change your password in Settings.\n\nEmail: ${inviteeEmail}\nTemporary password: ${temporaryPassword}\n\nSign in: ${url}\n\n— BrewLedger`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5;color:#333;"><p>Hi ${escapeHtml(name)},</p><p>You've been invited to join <strong>${escapeHtml(org)}</strong> on BrewLedger. Sign in with this email and the temporary password below, then change your password in Settings.</p><p><strong>Email:</strong> ${escapeHtml(inviteeEmail)}<br/><strong>Temporary password:</strong> ${escapeHtml(temporaryPassword)}</p><p><a href="${escapeHtml(url)}">Sign in</a></p><p>— BrewLedger</p></body></html>`
  };
}

function resetPasswordEmail({ resetLink }) {
  return {
    subject: 'Reset your BrewLedger password',
    text: `You requested a password reset. This link expires in 1 hour. If you didn't request this, you can ignore this email.\n\nReset password: ${resetLink}\n\n— BrewLedger`,
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5;color:#333;"><p>You requested a password reset. This link expires in 1 hour. If you didn't request this, you can ignore this email.</p><p><a href="${escapeHtml(resetLink)}">Reset password</a></p><p>— BrewLedger</p></body></html>`
  };
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { welcomeEmail, inviteEmail, resetPasswordEmail };
