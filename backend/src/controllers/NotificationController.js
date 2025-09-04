// Arquivo: backend/src/controllers/NotificationController.js
const prisma = require('../database/prisma');
const { sendMail } = require('../services/EmailService');
const { logAction } = require('../services/AuditLogService');
const path = require('path');
const { calculateNextReminder } = require('../services/CronService');

const cleanMessageId = (idString) => {
  if (!idString) return null;
  const match = idString.match(/<([^>]+)>/);
  return match ? match[1] : idString;
};

module.exports = {
  // ... (a função index não muda)
  async index(request, response) {
    const notifications = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { name: true } },
        submittedByUser: { select: { name: true } },
      },
    });
    return response.json(notifications);
  },

  async submit(request, response) {
    const { templateId, clienteIds, recipients, emailAccountId, finalSubject, finalBody } = request.body;
    const senderId = request.user.id;

    if (!emailAccountId) {
      return response.status(400).json({ message: 'Selecione uma conta de e-mail para o envio.' });
    }
    if (!templateId) {
      return response.status(400).json({ message: 'Um template deve ser associado à notificação.' });
    }
    if (!finalSubject || !finalBody) {
      return response.status(400).json({ message: 'O assunto e o corpo do e-mail não podem estar vazios.' });
    }

    const templateWithCategory = await prisma.template.findUnique({
      where: { id: templateId },
      include: { category: true },
    });

    if (!templateWithCategory) {
      return response.status(404).json({ message: 'Template não encontrado.' });
    }

    let firstReminderDate = null;
    if (templateWithCategory.category) {
      firstReminderDate = calculateNextReminder(templateWithCategory.category);
    }

    let finalRecipients = [];
    let clienteConnectData = {};

    if (clienteIds && clienteIds.length > 0) {
      const clientes = await prisma.cliente.findMany({ where: { id: { in: clienteIds } } });
      const emailSet = new Set();
      clientes.forEach(cli => {
        if (Array.isArray(cli.emails)) {
          cli.emails.forEach(email => emailSet.add(email));
        }
      });
      finalRecipients = Array.from(emailSet);
      clienteConnectData = { clientes: { connect: clienteIds.map(id => ({ id })) } };
    } else if (recipients && recipients.length > 0) {
      finalRecipients = recipients;
    } else {
      return response.status(400).json({ message: 'Nenhum destinatário foi fornecido.' });
    }

    if (finalRecipients.length === 0) {
      return response.status(400).json({ message: 'A lista de destinatários está vazia.' });
    }

    const attachmentsForDb = request.files ? request.files.map(file => ({
      filename: file.originalname,
      storedFilename: file.filename,
    })) : [];

    const sender = await prisma.user.findUnique({ where: { id: senderId }, include: { profile: true } });
    const canApprove = sender.profile.permissions?.canApproveNotifications;

    const notificationData = {
      recipients: finalRecipients,
      subject: finalSubject,
      body: finalBody,
      templateId: templateId,
      submittedByUserId: senderId,
      emailAccountId: emailAccountId,
      attachments: attachmentsForDb,
      nextReminderAt: firstReminderDate,
      senderHasReadReply: false,
      ...clienteConnectData,
    };

    if (canApprove) {
      try {
        const newNotification = await prisma.notificationLog.create({
          data: { ...notificationData, status: 'SENT', approvedByUserId: senderId, approvedAt: new Date(), sentAt: new Date() },
        });

        // Gera e salva o protocolo, e GUARDA o resultado atualizado
        const notificationWithProtocol = await prisma.notificationLog.update({
          where: { id: newNotification.id },
          //          data: { protocol: `HERMES-${newNotification.id.substring(0, 8).toUpperCase()}` }
          data: { protocol: newNotification.id.substring(0, 8).toUpperCase() }
        });

        // PASSA o objeto ATUALIZADO para a função de envio
        await module.exports.approveAndSend(notificationWithProtocol);

        await logAction({ userId: senderId, action: 'NOTIFICATION_AUTO_APPROVED', details: { notificationId: newNotification.id, subject: finalSubject } });
        return response.status(200).json({ message: 'Notificação enviada com sucesso!' });
      } catch (error) {
        console.error("Erro na auto-aprovação:", error);
        return response.status(500).json({ message: 'Erro ao enviar notificação.' });
      }
    } else {
      const newNotification = await prisma.notificationLog.create({
        data: { ...notificationData, status: 'PENDING' },
      });

      // Gera e salva o protocolo
      await prisma.notificationLog.update({
        where: { id: newNotification.id },
        //data: { protocol: `HERMES-${newNotification.id.substring(0, 8).toUpperCase()}` }
        data: { protocol: newNotification.id.substring(0, 8).toUpperCase() }
      });

      await logAction({ userId: senderId, action: 'NOTIFICATION_SUBMITTED', details: { notificationId: newNotification.id, subject: finalSubject } });

      const approvers = await prisma.user.findMany({ where: { profile: { permissions: { path: ['canApproveNotifications'], equals: true } } } });
      for (const approver of approvers) {
        await sendMail({
          to: approver.email,
          subject: `[PARA APROVAÇÃO] ${finalSubject}`,
          html: `<h1>Revisão Necessária</h1><p>Uma nova notificação, enviada por <strong>${sender.name}</strong>, está aguardando sua aprovação.</p><p><strong>Assunto:</strong> ${finalSubject}</p><p>Por favor, acesse a página de aprovações para revisar.</p>`,
          accountId: emailAccountId
        });
      }

      return response.status(201).json({ message: 'Sua notificação foi enviada para aprovação.' });
    }
  },

  async reject(request, response) {
    const { id } = request.params;
    const { reason } = request.body;
    const approverId = request.user.id;

    if (!reason) {
      return response.status(400).json({ message: 'A justificativa é obrigatória para rejeitar.' });
    }

    try {
      const notification = await prisma.notificationLog.findUnique({
        where: { id },
        include: { submittedByUser: true },
      });

      if (!notification || notification.status !== 'PENDING') {
        return response.status(404).json({ message: 'Notificação não encontrada ou já processada.' });
      }

      await prisma.notificationLog.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedByUserId: approverId,
          approvedAt: new Date(),
          rejectionReason: reason,
        },
      });

      await sendMail({
        to: notification.submittedByUser.email,
        subject: `Notificação Rejeitada: "${notification.subject}"`,
        html: `<h1>Sua notificação foi rejeitada.</h1><p>A notificação com o assunto "<strong>${notification.subject}</strong>" foi rejeitada pelo aprovador.</p><hr><h3>Justificativa:</h3><p><em>${reason}</em></p><hr><p>Por favor, revise o conteúdo e submeta novamente se necessário.</p>`,
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

  async approveAndSend(notification) {
    const finalAttachments = Array.isArray(notification.attachments)
      ? notification.attachments.map(att => ({
        filename: att.filename,
        path: path.resolve(__dirname, '..', '..', 'public', 'attachments', att.storedFilename)
      }))
      : [];
    const inlineImages = notification.body.match(/src="cid:[^"]+"/g) || [];
    inlineImages.forEach(imgTag => {
      const cid = imgTag.substring(9, imgTag.length - 1);
      const attachmentPath = path.resolve(__dirname, '..', '..', 'public', 'attachments');
      try {
        const files = require('fs').readdirSync(attachmentPath);
        const filename = files.find(f => f.startsWith(cid));
        if (filename) {
          finalAttachments.push({ filename: filename, path: path.resolve(attachmentPath, filename), cid: cid });
        }
      } catch (error) { console.error(`[approveAndSend] Erro ao ler diretório de anexos para o CID ${cid}:`, error); }
    });

    const protocol = notification.protocol || `HERMES-${notification.id.substring(0, 8).toUpperCase()}`;
    const finalHtmlBody = notification.body.replace(/\[PROTOCOLO\]/g, protocol);
    const finalSubject = notification.subject.replace(/\[PROTOCOLO\]/g, protocol);
    const companyEmailsSetting = await prisma.systemSetting.findUnique({ where: { key: 'companyCCEmails' } });
    let ccEmails = [];
    if (companyEmailsSetting && companyEmailsSetting.value) {
      ccEmails = companyEmailsSetting.value.split(',').map(email => email.trim()).filter(Boolean);
    }

    // --- CORREÇÃO PRINCIPAL AQUI ---
    // Trocamos 'bcc' por 'to'. Agora todos os destinatários se verão.
    const result = await sendMail({
      to: notification.recipients, // Usamos TO para a lista principal
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      subject: finalSubject,
      html: finalHtmlBody,
      accountId: notification.emailAccountId,
      attachments: finalAttachments,
    });
    // --- FIM DA CORREÇÃO ---

    if (result.success && result.messageId) {
      await prisma.notificationLog.update({
        where: { id: notification.id },
        data: { messageId: cleanMessageId(result.messageId) },
      });
    } else {
      throw new Error("Falha ao enviar e-mail ou obter Message-ID.");
    }
  },

  async approve(request, response) {
    const { id } = request.params;
    const approverId = request.user.id;
    try {
      const notification = await prisma.notificationLog.findUnique({ where: { id } });
      if (!notification || notification.status !== 'PENDING') { return response.status(404).json({ message: 'Notificação não encontrada ou já processada.' }); }
      if (!notification.emailAccountId) { return response.status(500).json({ message: 'Erro: A notificação não tem uma conta de e-mail de envio associada.' }); }

      await module.exports.approveAndSend(notification);

      await prisma.notificationLog.update({
        where: { id },
        data: { status: 'SENT', approvedByUserId: approverId, approvedAt: new Date(), sentAt: new Date() },
      });
      await logAction({ userId: approverId, action: 'NOTIFICATION_APPROVE', details: { notificationId: id, subject: notification.subject } });
      return response.json({ message: 'Notificação aprovada e enviada.' });
    } catch (error) {
      console.error("Erro ao aprovar e enviar notificação:", error);
      await prisma.notificationLog.update({ where: { id }, data: { status: 'FAILED' } });
      return response.status(500).json({ message: 'Erro ao enviar notificação.' });
    }
  },
}