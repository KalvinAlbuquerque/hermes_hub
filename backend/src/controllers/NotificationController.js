// Arquivo: backend/src/controllers/NotificationController.js
const prisma = require('../database/prisma');
const { sendMail } = require('../services/EmailService');
const { logAction } = require('../services/AuditLogService');
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
    // Agora esperamos 'clienteIds' OU 'recipients' no corpo
    const { templateId, clienteIds, recipients, variables, emailAccountId } = request.body;
    const senderId = request.user.id;

    let finalRecipients = [];
    let clienteConnectData = {};

    // 1. Lógica para determinar a lista final de e-mails
    if (clienteIds && clienteIds.length > 0) {
      // MODO CLIENTE: Busca os e-mails dos clientes selecionados
      const clientes = await prisma.cliente.findMany({
        where: { id: { in: clienteIds } },
      });

      const emailSet = new Set();
      clientes.forEach(cli => {
        if (Array.isArray(cli.emails)) {
          cli.emails.forEach(email => emailSet.add(email));
        }
      });
      finalRecipients = Array.from(emailSet);

      // Prepara o objeto para conectar o log aos clientes
      clienteConnectData = {
        clientes: {
          connect: clienteIds.map(id => ({ id })),
        },
      };

    } else if (recipients && recipients.length > 0) {
      // MODO MANUAL: Usa a lista de e-mails diretamente
      finalRecipients = recipients;
    } else {
      return response.status(400).json({ message: 'Nenhum destinatário foi fornecido.' });
    }

    if (finalRecipients.length === 0) {
      return response.status(400).json({ message: 'A lista de destinatários está vazia.' });
    }

    // --- O RESTO DA LÓGICA PERMANECE MUITO PARECIDO ---
    const sender = await prisma.user.findUnique({ where: { id: senderId }, include: { profile: true } });
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

    const canApprove = sender.profile.permissions?.canApproveNotifications;

    // Prepara os dados base para o log de notificação
    const notificationData = {
      recipients: finalRecipients,
      subject: finalSubject,
      body: finalBody,
      templateId: template.id,
      submittedByUserId: senderId,
      ...clienteConnectData, // Adiciona a conexão com clientes, se houver
    };

    if (canApprove) {
      // LÓGICA DE AUTO-APROVAÇÃO...
      try {
        for (const recipient of finalRecipients) {
          await sendMail({ to: recipient, subject: finalSubject, html: finalBody, accountId: emailAccountId });
        }
        const newNotification = await prisma.notificationLog.create({
          data: { ...notificationData, emailAccountId: emailAccountId, status: 'SENT', approvedByUserId: senderId, approvedAt: new Date(), sentAt: new Date() },
        });
        await logAction({ userId: senderId, action: 'NOTIFICATION_AUTO_APPROVED', details: { notificationId: newNotification.id, subject: finalSubject } });

        // Retorna a mensagem de sucesso direto
        return response.status(200).json({ message: 'Notificação enviada com sucesso!' });
      } catch (error) {
        return response.status(500).json({ message: 'Erro ao enviar notificação.' });
      }
    } else {
      // LÓGICA DE SUBMISSÃO PARA APROVAÇÃO...
      const newNotification = await prisma.notificationLog.create({
        data: { ...notificationData, status: 'PENDING' },
      });
      await logAction({ userId: senderId, action: 'NOTIFICATION_SUBMITTED', details: { notificationId: newNotification.id, subject: finalSubject } });

      const approvers = await prisma.user.findMany({
        where: { profile: { permissions: { path: ['canApproveNotifications'], equals: true } } },
      });

      for (const approver of approvers) {
        await sendMail({
          to: approver.email,
          subject: '[Hermes Hub] Nova notificação para aprovação',
          html: `
                <h1>Revisão Necessária</h1>
                <p>Olá, ${approver.name}.</p>
                <p>Uma nova notificação, enviada por <strong>${sender.name}</strong>, está aguardando sua aprovação.</p>
                <ul>
                  <li><strong>Assunto:</strong> ${finalSubject}</li>
                </ul>
                <p>Por favor, acesse a <a href="http://localhost:3000/approvals">página de aprovações</a> para revisar e tomar uma ação.</p>
              `,
        });
      }

      // Retorna a mensagem de que foi para aprovação
      return response.status(201).json({ message: 'Sua notificação foi enviada para aprovação.' });
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

      await logAction({
        userId: approverId,
        action: 'NOTIFICATION_REJECT',
        details: { notificationId: id, subject: notification.subject, reason: reason }
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
      
      // VERIFICAÇÃO IMPORTANTE: Garante que a notificação tem uma conta de envio associada.
      if (!notification.emailAccountId) {
          return response.status(500).json({ message: 'Erro: A notificação pendente não tem uma conta de e-mail de envio associada.'});
      }

      // Envia o e-mail para cada destinatário usando a conta de e-mail guardada.
      for (const recipient of notification.recipients) {
        await sendMail({
          to: recipient,
          subject: notification.subject,
          html: notification.body,
          accountId: notification.emailAccountId, // <-- PASSA O ID DA CONTA CORRETA
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

      // Log de auditoria para a aprovação
      await logAction({
          userId: approverId,
          action: 'NOTIFICATION_APPROVE',
          details: { notificationId: id, subject: notification.subject }
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
}