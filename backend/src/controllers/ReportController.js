// Arquivo: backend/src/controllers/ReportController.js
const prisma = require('../database/prisma');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// --- LÓGICA PARA RELATÓRIOS DE AUDITORIA ---

// Função auxiliar para buscar e filtrar os logs de auditoria
async function getFilteredAuditLogs(queryParams) {
  const { userId, action, startDate, endDate } = queryParams;
  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  if (endDate) {
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    where.createdAt = { ...where.createdAt, lte: nextDay };
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
}

// Gerar relatório de logs de auditoria em CSV
module.exports.generateAuditLogsCSV = async (request, response) => {
    try {
      const logs = await getFilteredAuditLogs(request.query);

      const formattedLogs = logs.map(log => ({
        Data: new Date(log.createdAt).toLocaleString('pt-BR'),
        Usuario: log.user.name,
        Acao: log.action,
        Detalhes: JSON.stringify(log.details),
      }));

      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(formattedLogs);

      response.header('Content-Type', 'text/csv');
      response.attachment('relatorio_auditoria.csv');
      return response.send(csv);

    } catch (error) {
      response.status(500).json({ message: "Erro ao gerar relatório CSV." });
    }
};

// Gerar relatório de logs de auditoria em PDF
module.exports.generateAuditLogsPDF = async (request, response) => {
    try {
      const logs = await getFilteredAuditLogs(request.query);
      
      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      response.header('Content-Type', 'application/pdf');
      response.attachment('relatorio_auditoria.pdf');
      doc.pipe(response);

      doc.fontSize(18).text('Relatório de Auditoria - Hermes Hub', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12);
      const tableTop = doc.y;
      const itemX = 30;
      const dateX = itemX;
      const userX = 150;
      const actionX = 250;
      const detailsX = 350;

      doc.font('Helvetica-Bold')
        .text('Data', dateX, tableTop)
        .text('Usuário', userX, tableTop)
        .text('Ação', actionX, tableTop)
        .text('Detalhes', detailsX, tableTop);
      doc.font('Helvetica').moveDown();

      logs.forEach(log => {
        const y = doc.y;
        doc.text(new Date(log.createdAt).toLocaleDateString('pt-BR'), dateX, y, { width: 100 });
        doc.text(log.user.name, userX, y, { width: 100 });
        doc.text(log.action, actionX, y, { width: 100 });
        doc.text(JSON.stringify(log.details, null, 2), detailsX, y, { width: 220 });
        doc.moveDown(2);
      });
      
      doc.end();

    } catch (error) {
      response.status(500).json({ message: "Erro ao gerar relatório PDF." });
    }
};


// --- LÓGICA PARA RELATÓRIOS DE NOTIFICAÇÃO ---

// Função auxiliar para buscar e filtrar os logs de notificação
async function getFilteredNotificationLogs(queryParams) {
    const { templateId, clienteId, status, submittedByUserId, subject, startDate, endDate } = queryParams;
    const where = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (submittedByUserId) where.submittedByUserId = submittedByUserId;
    if (clienteId) where.clientes = { some: { id: clienteId } };
    
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.createdAt = { ...where.createdAt, lte: nextDay };
    }

    return prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            template: { select: { name: true } },
            submittedByUser: { select: { name: true } },
            approvedByUser: { select: { name: true } },
            clientes: { select: { name: true } },
        },
    });
}

// Gerar relatório de notificações em CSV
module.exports.generateNotificationLogsCSV = async (request, response) => {
    try {
        const logs = await getFilteredNotificationLogs(request.query);
        const formattedLogs = logs.map(log => ({
            Data: new Date(log.createdAt).toLocaleString('pt-BR'),
            Assunto: log.subject,
            Template: log.template.name,
            Status: log.status,
            EnviadoPor: log.submittedByUser.name,
            AprovadoPor: log.approvedByUser?.name || 'N/A',
            Clientes: log.clientes.map(c => c.name).join('; '),
        }));

        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(formattedLogs);
        response.header('Content-Type', 'text/csv');
        response.attachment('relatorio_notificacoes.csv');
        return response.send(csv);
    } catch (error) {
        response.status(500).json({ message: "Erro ao gerar relatório CSV de notificações." });
    }
};

// Gerar relatório de notificações em PDF
module.exports.generateNotificationLogsPDF = async (request, response) => {
    try {
        const logs = await getFilteredNotificationLogs(request.query);
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

        response.header('Content-Type', 'application/pdf');
        response.attachment('relatorio_notificacoes.pdf');
        doc.pipe(response);

        doc.fontSize(16).text('Relatório de Notificações - Hermes Hub', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10);
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Data', 30, tableTop, { width: 90 });
        doc.text('Assunto', 120, tableTop, { width: 150 });
        doc.text('Template', 270, tableTop, { width: 100 });
        doc.text('Status', 370, tableTop, { width: 60 });
        doc.text('Enviado Por', 430, tableTop, { width: 100 });
        doc.text('Aprovado Por', 530, tableTop, { width: 100 });
        doc.text('Clientes', 630, tableTop, { width: 140 });
        doc.font('Helvetica').moveDown();

        logs.forEach(log => {
            const y = doc.y;
            doc.text(new Date(log.createdAt).toLocaleString('pt-BR'), 30, y, { width: 90 });
            doc.text(log.subject, 120, y, { width: 150 });
            doc.text(log.template.name, 270, y, { width: 100 });
            doc.text(log.status, 370, y, { width: 60 });
            doc.text(log.submittedByUser.name, 430, y, { width: 100 });
            doc.text(log.approvedByUser?.name || 'N/A', 530, y, { width: 100 });
            doc.text(log.clientes.map(c => c.name).join(', '), 630, y, { width: 140 });
            doc.moveDown(1.5);
        });
        
        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF de notificações:", error);
        response.status(500).json({ message: "Erro ao gerar relatório PDF de notificações." });
    }
};