// Arquivo: backend/src/services/EmailService.js
const nodemailer = require('nodemailer');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');
const { createTransporter: createOAuth2Transporter, oauth2Client } = require('./OAuthService'); // Importar o serviço OAuth

async function sendMail({ to, cc, subject, html, accountId, attachments = [] }) {
  try {
    const account = await prisma.emailAccount.findUnique({ where: { id: accountId } });

    if (!account || account.status !== 'ACTIVE') {
      return { success: false, error: 'Conta de e-mail não encontrada ou inativa.' };
    }

    let transporter;

    // Se a conta usa OAuth2
    if (account.authType === 'OAUTH2') {
      const oauth2Client = createOAuth2Transporter(account);
      const { token: accessToken } = await oauth2Client.getAccessToken(); // Atualiza o token se necessário

      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: account.email,
          clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          refreshToken: account.refreshToken,
          accessToken,
        },
      });
    } else {
      // Lógica existente para autenticação por senha
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