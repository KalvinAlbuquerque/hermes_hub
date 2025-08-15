// Arquivo: backend/src/controllers/NotificationController.js
const prisma = require('../database/prisma');
const { sendMail } = require('../services/EmailService');

module.exports = {
  // Lista todas as notificações (para a tela de aprovação)
  async index(request, response) {
    const notifications = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { // Inclui dados do template e do usuário que submeteu
        template: { select: { name: true } },
        submittedByUser: { select: { name: true } },
      },
    });
    return response.json(notifications);
  },

  // Antiga função 'send', agora 'submit'
  async submit(request, response) {
    const { templateId, recipients, variables } = request.body;
    const senderId = request.user.id;

    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return response.status(404).json({ message: 'Template não encontrado.' });
    }

    // Prepara o corpo e o assunto com as variáveis
    let finalSubject = template.subject;
    let finalBody = template.body;
    for (const key in variables) {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      finalSubject = finalSubject.replace(regex, variables[key]);
      finalBody = finalBody.replace(regex, variables[key]);
    }

    // Cria o log com status PENDENTE, sem enviar o e-mail
    await prisma.notificationLog.create({
      data: {
        recipients: recipients, // Salva o array de e-mails
        status: 'PENDING',
        subject: finalSubject,
        body: finalBody,
        templateId: template.id,
        submittedByUserId: senderId,
      },
    });

    return response.status(201).json({ message: 'Notificação submetida para aprovação.' });
  },

  // Nova função para aprovar e ENVIAR
  async approve(request, response) {
    const { id } = request.params; // ID do NotificationLog
    const approverId = request.user.id;

    try {
      const notification = await prisma.notificationLog.findUnique({ where: { id } });

      if (!notification || notification.status !== 'PENDING') {
        return response.status(404).json({ message: 'Notificação não encontrada ou já processada.' });
      }

      // Envia o e-mail para cada destinatário
      for (const recipient of notification.recipients) {
        await sendMail({
          to: recipient,
          subject: notification.subject,
          html: notification.body,
        });
      }

      // Atualiza o log no banco
      await prisma.notificationLog.update({
        where: { id },
        data: {
          status: 'SENT',
          approvedByUserId: approverId,
          approvedAt: new Date(),
          sentAt: new Date(),
        },
      });

      return response.json({ message: 'Notificação aprovada e enviada.' });
    } catch (error) {
      // Se o envio falhar, ainda atualizamos o status para FAILED
      await prisma.notificationLog.update({
        where: { id },
        data: { status: 'FAILED' },
      });
      return response.status(500).json({ message: 'Erro ao enviar notificação.' });
    }
  },
};