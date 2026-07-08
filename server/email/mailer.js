/**
 * SES mailer: send transactional email via AWS SDK v3.
 * Env: AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY, AWS_SES_FROM_EMAIL.
 * Failures are logged; they do not throw (auth flows must not block on email).
 */

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const region = process.env.AWS_SES_REGION;
const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
const fromEmail = process.env.AWS_SES_FROM_EMAIL;

let client = null;
if (region && accessKeyId && secretAccessKey && fromEmail) {
  client = new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });
} else if (process.env.NODE_ENV !== 'test') {
  console.warn('[mailer] SES not configured: set AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY, AWS_SES_FROM_EMAIL to send email.');
}

/**
 * @param {{ to: string, subject: string, text?: string, html?: string }} opts
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, text, html }) {
  if (!to || typeof to !== 'string' || !subject || typeof subject !== 'string') {
    console.warn('[mailer] sendEmail skipped: invalid to or subject');
    return;
  }
  if (!client) return;

  const body = {};
  if (text) body.Text = { Data: text, Charset: 'UTF-8' };
  if (html) body.Html = { Data: html, Charset: 'UTF-8' };
  if (!body.Text && !body.Html) {
    console.warn('[mailer] sendEmail skipped: no text or html body');
    return;
  }

  try {
    await client.send(new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [to.trim()] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: body
      }
    }));
  } catch (err) {
    console.error('[mailer] sendEmail failed:', err.message);
  }
}

module.exports = { sendEmail };
