// Arquivo: backend/src/services/EmailService.js
const nodemailer = require('nodemailer');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');

// Agora a função recebe o ID da conta a ser usada
async function sendMail({ to, subject, html, accountId }) {
  try {
    // 1. Busca a conta de e-mail específica no banco
    const account = await prisma.emailAccount.findUnique({ where: { id: accountId } });

    if (!account || account.status !== 'ACTIVE') {
      return { success: false, error: 'Conta de e-mail não encontrada ou inativa.' };
    }

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      auth: {
        user: account.smtpUser,
        pass: decrypt(account.smtpPass), // Desencripta a senha
      },
    });

    const info = await transporter.sendMail({
      from: `"${account.name}" <${account.email}>`,
      to, subject, html,
    });

    console.log(`E-mail enviado para ${to} usando ${account.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
    return { success: false, error: error };
  }
}

module.exports = { sendMail };