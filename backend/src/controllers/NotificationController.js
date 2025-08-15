// Arquivo: backend/src/controllers/NotificationController.js
const prisma = require('../database/prisma');
const { sendMail } = require('../services/EmailService');

module.exports = {
  async send(request, response) {
    const { templateId, recipients, variables } = request.body; // recipients é um array de e-mails
    const senderId = request.user.id;

    // 1. Busca o template no banco
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return response.status(404).json({ message: 'Template não encontrado.' });
    }

    // 2. Itera sobre os destinatários e envia o e-mail para cada um
    for (const recipient of recipients) {
      let processedBody = template.body;
      // Substitui as variáveis no corpo do e-mail
      for (const key in variables) {
        processedBody = processedBody.replace(new RegExp(`\\[${key}\\]`, 'g'), variables[key]);
      }

      // Envia o e-mail
      const result = await sendMail({
        to: recipient,
        subject: template.subject,
        html: processedBody,
      });

      // 3. Grava o log do envio
      await prisma.notificationLog.create({
        data: {
          recipientEmail: recipient,
          status: result.success ? 'ENVIADO' : 'FALHOU',
          templateId: template.id,
          sentByUserId: senderId,
        },
      });
    }

    return response.status(200).json({ message: 'Notificações enviadas para a fila.' });
  },
};