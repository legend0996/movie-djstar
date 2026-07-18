const nodemailer = require('nodemailer');
const config = require('../config');
const templates = require('../emails/templates');
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
    const html = templates.verificationCode(username, code, config.security.verificationCodeExpiryMinutes);
    return this.sendMail({
      to: email,
      subject: 'Verify Your Email - DJ Star Original Movies',
      html,
      text: `Your verification code is: ${code}. It expires in ${config.security.verificationCodeExpiryMinutes} minutes.`,
    });
  },

  async sendPasswordResetCode(email, code, username) {
    const html = templates.passwordResetCode(username, code, config.security.passwordResetExpiryMinutes);
    return this.sendMail({
      to: email,
      subject: 'Password Reset Code - DJ Star Original Movies',
      html,
      text: `Your password reset code is: ${code}. It expires in ${config.security.passwordResetExpiryMinutes} minutes.`,
    });
  },

  async sendWelcomeEmail(email, username) {
    const html = templates.welcome(username);
    return this.sendMail({
      to: email,
      subject: 'Welcome to DJ Star Original Movies!',
      html,
      text: `Welcome ${username}! Your email has been verified. Start browsing movies at ${config.app.url}/movies`,
    });
  },

  async sendPurchaseReceipt(email, username, receiptData) {
    const html = templates.purchaseReceipt(username, receiptData);
    return this.sendMail({
      to: email,
      subject: `Receipt - ${receiptData.movieTitle} - DJ Star Original Movies`,
      html,
      text: `Purchase confirmed! Receipt #${receiptData.receiptNumber}. Movie: ${receiptData.movieTitle}. Amount: KES ${Number(receiptData.amount).toFixed(2)}. M-Pesa Receipt: ${receiptData.mpesaReceipt}.`,
    });
  },

  async sendPasswordChangeConfirmation(email, username) {
    const html = templates.passwordChanged(username);
    return this.sendMail({
      to: email,
      subject: 'Password Changed - DJ Star Original Movies',
      html,
      text: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
    });
  },

  async sendSupportNotification(email, ticketNumber, subject) {
    const html = templates.supportTicket(ticketNumber, subject);
    return this.sendMail({
      to: email,
      subject: `Support Ticket #${ticketNumber} - Received`,
      html,
      text: `Your support ticket #${ticketNumber} has been created. Subject: ${subject}.`,
    });
  },
};

module.exports = emailService;
