const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else {
    logger.warn('Email credentials not configured. Emails will be logged only.');
    transporter = {
      sendMail: async (mailOptions) => {
        logger.info('Email would be sent:', { to: mailOptions.to, subject: mailOptions.subject });
        return { messageId: `logged-${Date.now()}` };
      },
    };
  }

  return transporter;
}

const emailService = {
  async sendMail({ to, subject, html, text }) {
    const transport = getTransporter();
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text,
    };

    try {
      const info = await transport.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
      return info;
    } catch (err) {
      logger.error('Failed to send email', { to, subject, error: err.message });
      throw err;
    }
  },

  async sendVerificationCode(email, code, username) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Welcome to DJ Star Original Movies!</h2>
        <p>Hello ${username || 'there'},</p>
        <p>Thank you for creating an account. Please use the following verification code to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #1a1a2e; color: #fff; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px;">
            ${code}
          </div>
        </div>
        <p>This code will expire in ${config.security.verificationCodeExpiryMinutes} minutes.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">DJ Star Original Movies - Premium Movie Platform</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: 'Verify Your Email - DJ Star Original Movies',
      html,
      text: `Your verification code is: ${code}. It expires in ${config.security.verificationCodeExpiryMinutes} minutes.`,
    });
  },

  async sendPasswordResetCode(email, code, username) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Password Reset Request</h2>
        <p>Hello ${username || 'there'},</p>
        <p>We received a request to reset your password. Use the following code to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: #1a1a2e; color: #fff; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px;">
            ${code}
          </div>
        </div>
        <p>This code will expire in ${config.security.passwordResetExpiryMinutes} minutes.</p>
        <p>If you did not request a password reset, please ignore this email or contact support.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">DJ Star Original Movies - Premium Movie Platform</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: 'Password Reset Code - DJ Star Original Movies',
      html,
      text: `Your password reset code is: ${code}. It expires in ${config.security.passwordResetExpiryMinutes} minutes.`,
    });
  },

  async sendWelcomeEmail(email, username) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Welcome to DJ Star Original Movies!</h2>
        <p>Hello ${username || 'there'},</p>
        <p>Your email has been verified successfully. You can now browse, purchase, and enjoy premium movies.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.app.url}/movies" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Browse Movies
          </a>
        </div>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">DJ Star Original Movies - Premium Movie Platform</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: 'Welcome to DJ Star Original Movies!',
      html,
      text: `Welcome ${username}! Your email has been verified. Start browsing movies at ${config.app.url}/movies`,
    });
  },

  async sendPurchaseReceipt(email, username, receiptData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Purchase Confirmed!</h2>
        <p>Hello ${username || 'there'},</p>
        <p>Thank you for your purchase! Your transaction has been completed successfully.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Receipt #${receiptData.receiptNumber}</h3>
          <p><strong>Movie:</strong> ${receiptData.movieTitle}</p>
          <p><strong>Amount:</strong> KES ${receiptData.amount.toFixed(2)}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>M-Pesa Receipt:</strong> ${receiptData.mpesaReceipt}</p>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${config.app.url}/my-library" style="background: #1a1a2e; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Go to My Library
          </a>
        </div>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">DJ Star Original Movies - Premium Movie Platform</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: `Receipt - ${receiptData.movieTitle} - DJ Star Original Movies`,
      html,
      text: `Purchase confirmed! Receipt #${receiptData.receiptNumber}. Movie: ${receiptData.movieTitle}. Amount: KES ${receiptData.amount.toFixed(2)}. M-Pesa Receipt: ${receiptData.mpesaReceipt}.`,
    });
  },

  async sendPasswordChangeConfirmation(email, username) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Password Changed Successfully</h2>
        <p>Hello ${username || 'there'},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">DJ Star Original Movies - Premium Movie Platform</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: 'Password Changed - DJ Star Original Movies',
      html,
      text: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
    });
  },

  async sendSupportNotification(email, ticketNumber, subject) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Support Ticket Created</h2>
        <p>Your support ticket has been created successfully.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Ticket #:</strong> ${ticketNumber}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Status:</strong> Open</p>
        </div>
        <p>We will get back to you as soon as possible.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">DJ Star Original Movies - Premium Movie Platform</p>
      </div>
    `;

    return this.sendMail({
      to: email,
      subject: `Support Ticket #${ticketNumber} - Received`,
      html,
      text: `Your support ticket #${ticketNumber} has been created. Subject: ${subject}.`,
    });
  },
};

module.exports = emailService;
