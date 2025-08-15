// Arquivo: backend/src/services/EmailService.js
const nodemailer = require('nodemailer');

// 1. Configura o "transportador" que fará a conexão com o Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Exporta a função que envia o e-mail
async function sendMail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Hermes Hub" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`E-mail enviado para ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${to}:`, error);
    return { success: false, error: error };
  }
}

module.exports = { sendMail };