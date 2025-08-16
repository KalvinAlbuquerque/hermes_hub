// Arquivo: backend/src/controllers/ReportController.js
const prisma = require('../database/prisma');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Função auxiliar para buscar e filtrar os logs (reaproveitando a lógica)
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

module.exports = {
  // Gerar relatório de logs em CSV
  async generateAuditLogsCSV(request, response) {
    try {
      const logs = await getFilteredAuditLogs(request.query);

      // Formata os dados para um CSV mais legível
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
  },

  // Gerar relatório de logs em PDF
  async generateAuditLogsPDF(request, response) {
    try {
      const logs = await getFilteredAuditLogs(request.query);

      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      response.header('Content-Type', 'application/pdf');
      response.attachment('relatorio_auditoria.pdf');
      doc.pipe(response); // Envia o PDF diretamente para a resposta

      // Cabeçalho do documento
      doc.fontSize(18).text('Relatório de Auditoria - Hermes Hub', { align: 'center' });
      doc.moveDown();

      // Tabela de Logs
      doc.fontSize(12);
      const tableTop = doc.y;
      const itemX = 30;
      const dateX = itemX;
      const userX = 150;
      const actionX = 250;
      const detailsX = 350;

      // Cabeçalho da tabela
      doc.font('Helvetica-Bold')
        .text('Data', dateX, tableTop)
        .text('Usuário', userX, tableTop)
        .text('Ação', actionX, tableTop)
        .text('Detalhes', detailsX, tableTop);
      doc.font('Helvetica').moveDown();

      // Linhas da tabela
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
  },
};