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

    // 1. Busca o usuário e seu perfil com permissões
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      include: { profile: true },
    });

    if (!sender) {
      return response.status(404).json({ message: 'Usuário remetente não encontrado.' });
    }

    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return response.status(404).json({ message: 'Template não encontrado.' });
    }

    let finalSubject = template.subject;
    let finalBody = template.body;
    for (const key in variables) {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      finalSubject = finalSubject.replace(regex, variables[key]);
      finalBody = finalBody.replace(regex, variables[key]);
    }

    // 2. Verifica se o usuário tem a permissão para aprovar
    const canApprove = sender.profile.permissions?.canApproveNotifications;

    if (canApprove) {
      // 3. SE PODE APROVAR: Envia o e-mail diretamente
      try {
        for (const recipient of recipients) {
          await sendMail({ to: recipient, subject: finalSubject, html: finalBody });
        }
        // Cria o log já como "SENT"
        await prisma.notificationLog.create({
          data: {
            recipients,
            status: 'SENT',
            subject: finalSubject,
            body: finalBody,
            templateId: template.id,
            submittedByUserId: senderId,
            approvedByUserId: senderId, // Auto-aprovado
            approvedAt: new Date(),
            sentAt: new Date(),
          },
        });
        return response.status(200).json({ message: 'Notificação enviada diretamente com sucesso!' });
      } catch (error) {
        // ... (Lógica de falha no envio)
        return response.status(500).json({ message: 'Erro ao enviar notificação.' });
      }
    } else {
      // 4. SE NÃO PODE APROVAR: Submete para aprovação (lógica original)
      await prisma.notificationLog.create({
        data: {
          recipients,
          status: 'PENDING',
          subject: finalSubject,
          body: finalBody,
          templateId: template.id,
          submittedByUserId: senderId,
        },
      });
      return response.status(201).json({ message: 'Notificação submetida para aprovação.' });
    }
  },
  async reject(request, response) {
    const { id } = request.params; // ID do NotificationLog
    const { reason } = request.body; // Motivo da rejeição vindo do frontend
    const approverId = request.user.id;

    if (!reason) {
      return response.status(400).json({ message: 'A justificativa é obrigatória para rejeitar.' });
    }

    try {
      const notification = await prisma.notificationLog.findUnique({
        where: { id },
        include: { submittedByUser: true }, // Inclui todos os dados do remetente
      });

      if (!notification || notification.status !== 'PENDING') {
        return response.status(404).json({ message: 'Notificação não encontrada ou já processada.' });
      }

      // Atualiza o log no banco com o status e o motivo
      await prisma.notificationLog.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedByUserId: approverId, // A pessoa que rejeitou
          approvedAt: new Date(),
          rejectionReason: reason,
        },
      });

      // Envia o e-mail de notificação para o analista
      await sendMail({
          to: notification.submittedByUser.email,
          subject: `Notificação Rejeitada: "${notification.subject}"`,
          html: `
              <h1>Sua notificação foi rejeitada.</h1>
              <p>A notificação com o assunto "<strong>${notification.subject}</strong>" foi rejeitada pelo aprovador.</p>
              <hr>
              <h3>Justificativa:</h3>
              <p><em>${reason}</em></p>
              <hr>
              <p>Por favor, revise o conteúdo e submeta novamente se necessário.</p>
          `,
      });

      return response.json({ message: 'Notificação rejeitada com sucesso.' });
    } catch (error) {
      console.error("Erro ao rejeitar notificação:", error);
      return response.status(500).json({ message: 'Erro interno ao processar a rejeição.' });
    }
  },
  
  async show(request, response) {
        try {
          const { id } = request.params;
          const notification = await prisma.notificationLog.findUnique({
            where: { id },
            include: {
              submittedByUser: { select: { name: true, email: true } },
              template: { select: { name: true } },
            },
          });

          if (!notification) {
            return response.status(404).json({ message: 'Notificação não encontrada.' });
          }

          return response.json(notification);
        } catch (error) {
          return response.status(500).json({ message: 'Erro ao buscar detalhes da notificação.' });
        }
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