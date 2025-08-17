// Arquivo: backend/src/services/EmailService.js
const nodemailer = require('nodemailer');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');

// A função agora aceita um array de anexos
async function sendMail({ to, subject, html, accountId, attachments = [] }) {
  try {
    const account = await prisma.emailAccount.findUnique({ where: { id: accountId } });

    if (!account || account.status !== 'ACTIVE') {
      return { success: false, error: 'Conta de e-mail não encontrada ou inativa.' };
    }

    const transporterOptions = {
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
    };

    if (account.smtpUser) {
        transporterOptions.auth = {
            user: account.smtpUser,
            pass: decrypt(account.smtpPass || ''),
        };
    }

    const transporter = nodemailer.createTransport(transporterOptions);

    // Monta as opções do e-mail, incluindo os anexos
    const mailOptions = {
        from: `"${account.name}" <${account.email}>`,
        to,
        subject,
        html,
        attachments: attachments, // <-- ANEXOS SÃO ADICIONADOS AQUI
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