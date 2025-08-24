// Arquivo: backend/src/controllers/ReportController.js

const prisma = require('../database/prisma');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const path = require('path');

// --- FUNÇÕES AUXILIARES ---

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

async function getFilteredNotificationLogs(queryParams) {
    const { templateId, clienteId, status, submittedByUserId, subject, startDate, endDate, protocol } = queryParams;
    const where = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (status) where.status = status;
    if (templateId) where.templateId = templateId;
    if (submittedByUserId) where.submittedByUserId = submittedByUserId;
    if (clienteId) where.clientes = { some: { id: clienteId } };
    if (protocol) where.protocol = { contains: protocol, mode: 'insensitive' };
    
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

// --- LÓGICA DE RELATÓRIOS ---

module.exports = {
  // --- Relatórios de Auditoria ---

  generateAuditLogsCSV: async (request, response) => {
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
  },

  generateAuditLogsJSON: async (request, response) => {
    try {
      const logs = await getFilteredAuditLogs(request.query);
      response.attachment('relatorio_auditoria.json');
      return response.json(logs);
    } catch (error) {
      response.status(500).json({ message: "Erro ao gerar relatório JSON." });
    }
  },

  generateAuditLogsPDF: async (request, response) => {
    try {
        const logs = await getFilteredAuditLogs(request.query);
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        response.header('Content-Type', 'application/pdf');
        response.attachment('relatorio_auditoria.pdf');
        doc.pipe(response);

        const settingsKeys = ['companyLogo', 'pdfReportTitle', 'pdfFooterText', 'pdfWatermark'];
        const settingsFromDb = await prisma.systemSetting.findMany({ where: { key: { in: settingsKeys } } });
        const settings = settingsFromDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
        
        const logoPath = settings.companyLogo ? path.join(__dirname, '..', '..', 'public', settings.companyLogo) : null;
        const reportTitle = settings.pdfReportTitle || 'Relatório de Auditoria';
        const footerText = settings.pdfFooterText || 'Documento gerado pelo Hermes Hub';
        const useWatermark = settings.pdfWatermark === 'true';

        // Helper para desenhar a marca d'água
        const addWatermark = () => {
             if (useWatermark && logoPath) {
                try {
                    doc.image(logoPath, { fit: [300, 300], align: 'center', valign: 'center', opacity: 0.03 });
                } catch(e) { console.error("Erro ao carregar imagem da marca d'água:", e); }
            }
        }

        // Helper para desenhar o cabeçalho da página
        const addPageHeader = () => {
            doc.rect(0, 0, doc.page.width, 90).fill('#f0f0f0');
            if (logoPath) {
                try {
                    doc.image(logoPath, 40, 30, { fit: [80, 50] });
                } catch (e) { console.error("Erro ao carregar imagem do logo:", e); }
            }
            doc.fontSize(18).fillColor('#333333').font('Helvetica-Bold').text(reportTitle, 0, 45, { align: 'center' });
            doc.fontSize(8).fillColor('#555555').font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, doc.page.margins.left, 50, { align: 'right' });
            doc.y = 100; // Posição inicial após o cabeçalho
        };
        
        // Adiciona um evento para cada nova página
        doc.on('pageAdded', addPageHeader);

        // Adiciona para a primeira página
        addWatermark();
        addPageHeader();
        
        // --- TABELA ---
        const tableTop = doc.y;
        const rowHeight = 30;
        const colWidths = [110, 110, 110, 200];
        const colStarts = [50, 160, 270, 380];

        // Cabeçalho da Tabela
        doc.rect(colStarts[0] - 10, tableTop, doc.page.width - 80, 20).fill('#333');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        doc.text('Data', colStarts[0], tableTop + 6);
        doc.text('Usuário', colStarts[1], tableTop + 6);
        doc.text('Ação', colStarts[2], tableTop + 6);
        doc.text('Detalhes', colStarts[3], tableTop + 6);
        doc.y = tableTop + 25;
        
        // Linhas da Tabela
        logs.forEach((log, i) => {
            if (doc.y + rowHeight > doc.page.height - 60) {
                doc.addPage();
                let newTableTop = doc.y;
                doc.rect(colStarts[0] - 10, newTableTop, doc.page.width - 80, 20).fill('#333');
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
                doc.text('Data', colStarts[0], newTableTop + 6).text('Usuário', colStarts[1], newTableTop + 6).text('Ação', colStarts[2], newTableTop + 6).text('Detalhes', colStarts[3], newTableTop + 6);
                doc.y = newTableTop + 25;
            }

            // Zebra striping
            if (i % 2 !== 0) {
                 doc.rect(colStarts[0] - 10, doc.y - 6, doc.page.width - 80, rowHeight).fill('#f9f9f9');
            }

            doc.font('Helvetica').fontSize(8).fillColor('#000000');
            const detailsText = log.details ? JSON.stringify(log.details) : 'N/A';
            doc.text(new Date(log.createdAt).toLocaleString('pt-BR'), colStarts[0], doc.y, { width: colWidths[0] });
            doc.text(log.user.name, colStarts[1], doc.y, { width: colWidths[1] });
            doc.text(log.action, colStarts[2], doc.y, { width: colWidths[2] });
            doc.text(detailsText, colStarts[3], doc.y, { width: colWidths[3] });

            doc.y += rowHeight - 14; // Move o cursor para a próxima linha
            doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#e0e0e0').stroke();
            doc.y += 5;
        });

        // Adiciona rodapés no final
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 1; i <= totalPages; i++) {
            doc.switchToPage(i - 1);
            doc.moveTo(40, doc.page.height - 50).lineTo(doc.page.width - 40, doc.page.height - 50).strokeColor('#dddddd').stroke();
            doc.fontSize(8).text(`${footerText} | Página ${i} de ${totalPages}`, doc.page.margins.left, doc.page.height - 45, { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
        }

        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF de auditoria:", error);
        if (!response.headersSent) {
            response.status(500).json({ message: "Erro ao gerar relatório PDF." });
        }
    }
  },
  // --- Relatórios de Notificação ---

  generateNotificationLogsCSV: async (request, response) => {
    try {
        const logs = await getFilteredNotificationLogs(request.query);
        const formattedLogs = logs.map(log => ({
            Data: new Date(log.createdAt).toLocaleString('pt-BR'),
            Protocolo: log.protocol,
            Assunto: log.subject,
            Template: log.template.name,
            Status: log.status,
            Status_Incidente: log.incidentStatus,
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
  },

  generateNotificationLogsJSON: async (request, response) => {
    try {
        const logs = await getFilteredNotificationLogs(request.query);
        response.attachment('relatorio_notificacoes.json');
        return response.json(logs);
    } catch (error) {
        response.status(500).json({ message: "Erro ao gerar relatório JSON de notificações." });
    }
  },
  
  generateNotificationLogsPDF: async (request, response) => {
    try {
        const logs = await getFilteredNotificationLogs(request.query);
        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

        response.header('Content-Type', 'application/pdf');
        response.attachment('relatorio_notificacoes.pdf');
        doc.pipe(response);

        const settingsKeys = ['companyLogo', 'pdfReportTitle', 'pdfFooterText', 'pdfWatermark'];
        const settingsFromDb = await prisma.systemSetting.findMany({ where: { key: { in: settingsKeys } } });
        const settings = settingsFromDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
        
        const logoPath = settings.companyLogo ? path.join(__dirname, '..', '..', 'public', settings.companyLogo) : null;
        const reportTitle = settings.pdfReportTitle || 'Relatório de Notificações';
        const footerText = settings.pdfFooterText || 'Documento gerado pelo Hermes Hub';
        const useWatermark = settings.pdfWatermark === 'true';

        const addWatermark = () => {
             if (useWatermark && logoPath) {
                doc.image(logoPath, { fit: [400, 400], align: 'center', valign: 'center', opacity: 0.03 });
            }
        }

        const addHeader = () => {
            doc.rect(0, 0, doc.page.width, 90).fill('#f0f0f0');
            if (logoPath) doc.image(logoPath, 40, 30, { fit: [80, 50] });
            doc.fontSize(18).fillColor('#333333').font('Helvetica-Bold').text(reportTitle, 0, 45, { align: 'center' });
            doc.fontSize(8).fillColor('#555555').font('Helvetica').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, doc.page.margins.left, 50, { align: 'right' });
            doc.y = 100;
        };
        
        const addFooter = (pageNumber, totalPages) => {
            doc.moveTo(40, doc.page.height - 50).lineTo(doc.page.width - 40, doc.page.height - 50).strokeColor('#dddddd').stroke();
            doc.fontSize(8).fillColor('#555555').text(`${footerText} | Página ${pageNumber} de ${totalPages}`, { align: 'center' });
        };
        
        doc.on('pageAdded', addHeader);
        
        addWatermark();
        addHeader();
        
        let tableTop = doc.y;
        const rowHeight = 30;
        const colWidths = [90, 130, 100, 100, 60, 130];
        const colStarts = [50, 140, 270, 370, 470, 530];

        doc.rect(colStarts[0] - 10, tableTop, doc.page.width - 80, 20).fill('#333');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        doc.text('Data', colStarts[0], tableTop + 6).text('Assunto', colStarts[1], tableTop + 6).text('Template', colStarts[2], tableTop + 6).text('Enviado Por', colStarts[3], tableTop + 6).text('Status', colStarts[4], tableTop + 6).text('Clientes', colStarts[5], tableTop + 6);
        doc.y = tableTop + 25;

        logs.forEach((log, i) => {
            if (doc.y + rowHeight > doc.page.height - 60) {
                doc.addPage();
                tableTop = doc.y;
                doc.rect(colStarts[0] - 10, tableTop, doc.page.width - 80, 20).fill('#333');
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
                doc.text('Data', colStarts[0], tableTop + 6).text('Assunto', colStarts[1], tableTop + 6).text('Template', colStarts[2], tableTop + 6).text('Enviado Por', colStarts[3], tableTop + 6).text('Status', colStarts[4], tableTop + 6).text('Clientes', colStarts[5], tableTop + 6);
                doc.y = tableTop + 25;
            }

            if (i % 2 !== 0) {
                 doc.rect(colStarts[0] - 10, doc.y - 6, doc.page.width - 80, rowHeight).fill('#f9f9f9');
            }

            doc.font('Helvetica').fontSize(8).fillColor('#000000');
            doc.text(new Date(log.createdAt).toLocaleString('pt-BR'), colStarts[0], doc.y, { width: colWidths[0] });
            doc.text(log.subject, colStarts[1], doc.y, { width: colWidths[1] });
            doc.text(log.template.name, colStarts[2], doc.y, { width: colWidths[2] });
            doc.text(log.submittedByUser.name, colStarts[3], doc.y, { width: colWidths[3] });
            doc.text(log.status, colStarts[4], doc.y, { width: colWidths[4] });
            doc.text(log.clientes.map(c => c.name).join(', '), colStarts[5], doc.y, { width: colWidths[5] });

            doc.y += rowHeight - 14;
            doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#e0e0e0').stroke();
            doc.y += 5;
        });

        const totalPages = doc.bufferedPageRange().count;
        for (let i = 1; i <= totalPages; i++) {
            doc.switchToPage(i - 1);
            addFooter(i, totalPages);
        }
        
        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF de notificações:", error);
         if (!response.headersSent) {
            response.status(500).json({ message: "Erro ao gerar relatório PDF de notificações." });
        }
    }
  },
};