// Arquivo: backend/src/services/EmailService.js
const nodemailer = require('nodemailer');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');
const { createTransporter: createOAuth2Transporter } = require('./OAuthService');

async function sendMail({ to, cc, subject, html, accountId, attachments = [] }) {
  try {
    const account = await prisma.emailAccount.findUnique({ where: { id: accountId } });

    if (!account || account.status !== 'ACTIVE') {
      return { success: false, error: 'Conta de e-mail não encontrada ou inativa.' };
    }

    let transporter;

    if (account.authType === 'OAUTH2') {
      // --- INÍCIO DA CORREÇÃO ---
      // Descriptografa o refreshToken antes de usá-lo
      const decryptedAccount = {
        ...account,
        refreshToken: decrypt(account.refreshToken || '')
      };
      // --- FIM DA CORREÇÃO ---

      const oauth2Client = createOAuth2Transporter(decryptedAccount);
      const { token: accessToken } = await oauth2Client.getAccessToken();

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: account.email,
          clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          refreshToken: decryptedAccount.refreshToken, // Usa o token descriptografado
          accessToken,
        },
      });
    } else {
      const transporterOptions = {
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        auth: {
          user: account.smtpUser,
          pass: decrypt(account.smtpPass || ''),
        },
        tls: { rejectUnauthorized: false }
      };
      transporter = nodemailer.createTransport(transporterOptions);
    }
    
    const mailOptions = {
      from: `"${account.name}" <${account.email}>`,
      to,
      cc,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`E-mail enviado para ${to} usando ${account.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
    return { success: false, error: error };
  }
}

module.exports = { sendMail };