const config = require('../config');

const styles = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;',
  header: 'background: #1a1a2e; color: #fff; padding: 20px; text-align: center;',
  content: 'padding: 30px;',
  button: 'display: inline-block; background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;',
  code: 'display: inline-block; background: #1a1a2e; color: #fff; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px;',
  footer: 'padding: 20px; text-align: center; color: #888; font-size: 12px;',
  receiptBox: 'background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;',
};

function wrap(html) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="${styles.header}">
                  <h1 style="margin: 0; font-size: 24px;">DJ Star Original Movies</h1>
                </td>
              </tr>
              <tr>
                <td style="${styles.content}">
                  ${html}
                </td>
              </tr>
              <tr>
                <td style="${styles.footer}">
                  <p>DJ Star Original Movies - Premium Movie Platform</p>
                  <p>${config.app.url}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function verificationCode(username, code, expiryMinutes) {
  return wrap(`
    <h2 style="color: #1a1a2e;">Welcome to DJ Star Original Movies!</h2>
    <p>Hello ${username || 'there'},</p>
    <p>Thank you for creating an account. Please use the following verification code to verify your email address:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="${styles.code}">${code}</div>
    </div>
    <p>This code will expire in ${expiryMinutes} minutes.</p>
    <p>If you did not create an account, please ignore this email.</p>
  `);
}

function passwordResetCode(username, code, expiryMinutes) {
  return wrap(`
    <h2 style="color: #1a1a2e;">Password Reset Request</h2>
    <p>Hello ${username || 'there'},</p>
    <p>We received a request to reset your password. Use the following code to reset it:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="${styles.code}">${code}</div>
    </div>
    <p>This code will expire in ${expiryMinutes} minutes.</p>
    <p>If you did not request a password reset, please ignore this email or contact support.</p>
  `);
}

function welcome(username) {
  return wrap(`
    <h2 style="color: #1a1a2e;">Welcome to DJ Star Original Movies!</h2>
    <p>Hello ${username || 'there'},</p>
    <p>Your email has been verified successfully. You can now browse, purchase, and enjoy premium movies.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${config.app.url}/movies" style="${styles.button}">Browse Movies</a>
    </div>
  `);
}

function purchaseReceipt(username, receiptData) {
  return wrap(`
    <h2 style="color: #1a1a2e;">Purchase Confirmed!</h2>
    <p>Hello ${username || 'there'},</p>
    <p>Thank you for your purchase! Your transaction has been completed successfully.</p>
    <div style="${styles.receiptBox}">
      <h3>Receipt #${receiptData.receiptNumber}</h3>
      <p><strong>Movie:</strong> ${receiptData.movieTitle}</p>
      <p><strong>Amount:</strong> KES ${Number(receiptData.amount).toFixed(2)}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>M-Pesa Receipt:</strong> ${receiptData.mpesaReceipt}</p>
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${config.app.url}/my-library" style="${styles.button}">Go to My Library</a>
    </div>
  `);
}

function passwordChanged(username) {
  return wrap(`
    <h2 style="color: #1a1a2e;">Password Changed Successfully</h2>
    <p>Hello ${username || 'there'},</p>
    <p>Your password has been changed successfully.</p>
    <p>If you did not make this change, please contact support immediately.</p>
  `);
}

function supportTicket(ticketNumber, subject) {
  return wrap(`
    <h2 style="color: #1a1a2e;">Support Ticket Created</h2>
    <p>Your support ticket has been created successfully.</p>
    <div style="${styles.receiptBox}">
      <p><strong>Ticket #:</strong> ${ticketNumber}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Status:</strong> Open</p>
    </div>
    <p>We will get back to you as soon as possible.</p>
  `);
}

module.exports = {
  verificationCode,
  passwordResetCode,
  welcome,
  purchaseReceipt,
  passwordChanged,
  supportTicket,
};
