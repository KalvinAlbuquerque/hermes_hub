// Arquivo: backend/src/services/EmailService.js
const nodemailer = require('nodemailer');
const prisma = require('../database/prisma');
const { decrypt } = require('./SettingsService');

async function sendMail({ to, subject, html, accountId }) {
  try {
    const account = await prisma.emailAccount.findUnique({ where: { id: accountId } });

    if (!account || account.status !== 'ACTIVE') {
      return { success: false, error: 'Conta de e-mail não encontrada ou inativa.' };
    }

    // 1. Monta as opções base do transportador
    const transporterOptions = {
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
    };

    // 2. Adiciona a autenticação APENAS se um utilizador SMTP for fornecido
    if (account.smtpUser) {
        transporterOptions.auth = {
            user: account.smtpUser,
            pass: decrypt(account.smtpPass || ''), // Desencripta a senha (ou uma string vazia)
        };
    }

    const transporter = nodemailer.createTransport(transporterOptions);

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