// Arquivo: backend/src/controllers/ReportController.js
const prisma = require('../database/prisma');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

async function addHeader(doc) {
    // Busca o logo da empresa no banco de dados
    const companyLogoSetting = await prisma.systemSetting.findUnique({
        where: { key: 'companyLogo' },
    });

    let logoPath;
    if (companyLogoSetting && companyLogoSetting.value) {
        // Usa o caminho completo para o logo da empresa
        logoPath = path.join(__dirname, '..', '..', 'public', companyLogoSetting.value);
    } else {
        // Fallback para o logo do Hermes Hub
        logoPath = path.join(__dirname, '..', '..', 'public', 'attachments', '1755458303755-712784618-hermes-logo-glow.png.png');
    }

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.margins.left, 25, { height: 40 });
    }

    const generatedAt = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    doc.fontSize(8).text(generatedAt, { align: 'right' });
    doc.moveDown(3);
}

// Adiciona o rodapé com número da página
function addFooter(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.count; i++) {
        doc.switchToPage(i);
        const text = `Página ${i + 1} de ${range.count}`;
        doc.fontSize(8).fillColor('gray').text(text, doc.page.margins.left, doc.page.height - 50, {
            align: 'center',
            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });
    }
}

// Função auxiliar para adicionar a marca d'água em todas as páginas
async function addWatermark(doc) {
    const companyLogoSetting = await prisma.systemSetting.findUnique({
        where: { key: 'companyLogo' },
    });
    // Não faz nada se a configuração do logo não existir ou estiver vazia
    if (!companyLogoSetting || !companyLogoSetting.value) return;

    const logoPath = path.join(__dirname, '..', '..', 'public', companyLogoSetting.value);
    // Não faz nada se o arquivo do logo não for encontrado
    if (!fs.existsSync(logoPath)) return;

    const imageWidth = 250;
    const { width, height } = doc.page;
    const x = (width - imageWidth) / 2;
    const y = (height - imageWidth) / 2; // Centraliza a imagem

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.count; i++) {
        doc.switchToPage(i);

        // --- INÍCIO DA NOVA LÓGICA ---
        // Salva o estado gráfico atual (cores, opacidade, etc.)
        doc.save();

        // Define uma opacidade global para os próximos elementos
        // Altere o valor 0.05 para deixar mais ou menos transparente
        doc.opacity(0.2);

        // Desenha a imagem. Ela será afetada pela opacidade definida acima.
        doc.image(logoPath, x, y, { width: imageWidth });

        // Restaura o estado gráfico para o normal (opacidade volta para 100%)
        doc.restore();
        // --- FIM DA NOVA LÓGICA ---
    }
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
        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

        response.header('Content-Type', 'application/pdf');
        doc.pipe(response);

        await addHeader(doc);

        doc.fontSize(16).font('Helvetica-Bold').text('Relatório de Auditoria', { align: 'center' });
        doc.moveDown(2);

        // --- CORREÇÃO: Ajuste de layout das colunas ---
        const tableTop = doc.y;
        const columnSpacing = 10;
        const dateX = doc.page.margins.left;
        const userX = dateX + 110 + columnSpacing;
        const actionX = userX + 100 + columnSpacing;
        const detailsX = actionX + 100 + columnSpacing;
        const detailsWidth = doc.page.width - doc.page.margins.right - detailsX;


        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Data', dateX, tableTop, { continued: true });
        doc.text('Usuário', userX, tableTop, { continued: true });
        doc.text('Ação', actionX, tableTop, { continued: true });
        doc.text('Detalhes', detailsX, tableTop);
        doc.moveDown();

        doc.strokeColor("#cccccc").lineWidth(1).moveTo(dateX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
        doc.moveDown();

        doc.font('Helvetica').fontSize(9);

        for (const log of logs) {
            const detailsText = log.details ? JSON.stringify(log.details, null, 2) : 'N/A';
            const rowHeight = Math.max(
                doc.heightOfString(log.action, { width: 100 }),
                doc.heightOfString(detailsText, { width: detailsWidth })
            );

            if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }

            const y = doc.y;
            doc.text(new Date(log.createdAt).toLocaleString('pt-BR'), dateX, y, { width: 110 });
            doc.text(log.user.name, userX, y, { width: 100 });
            doc.text(log.action, actionX, y, { width: 100 });
            doc.text(detailsText, detailsX, y, { width: detailsWidth });

            doc.y += rowHeight + 10;
            doc.strokeColor("#eeeeee").lineWidth(0.5).moveTo(dateX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
            doc.moveDown(2);
        }

        await addWatermark(doc);
        addFooter(doc);
        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF de auditoria:", error);
        response.status(500).json({ message: "Erro ao gerar relatório PDF." });
    }
};


// --- LÓGICA PARA RELATÓRIOS DE NOTIFICAÇÃO ---

// Função auxiliar para buscar e filtrar os logs de notificação
async function getFilteredNotificationLogs(queryParams) {
    const { templateId, clienteId, status, submittedByUserId, subject, startDate, endDate, protocol } = queryParams;
    const where = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (status) where.status = status;
    if (protocol) where.protocol = { contains: protocol, mode: 'insensitive' };
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
        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', bufferPages: true });

        response.header('Content-Type', 'application/pdf');
        doc.pipe(response);

        await addHeader(doc);

        doc.fontSize(16).font('Helvetica-Bold').text('Relatório de Notificações', { align: 'center' });
        doc.moveDown(2);

        const tableTop = doc.y;
        const columnSpacing = 10;
        const dateX = doc.page.margins.left;
        const subjectX = dateX + 90 + columnSpacing;
        const templateX = subjectX + 150 + columnSpacing;
        const sentByX = templateX + 90 + columnSpacing;
        const statusX = sentByX + 110 + columnSpacing;
        const clientsX = statusX + 60 + columnSpacing;
        const clientsWidth = doc.page.width - doc.page.margins.right - clientsX;

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Data', dateX, tableTop, { continued: true });
        doc.text('Assunto', subjectX, tableTop, { continued: true });
        doc.text('Template', templateX, tableTop, { continued: true });
        doc.text('Enviado Por', sentByX, tableTop, { continued: true });
        doc.text('Status', statusX, tableTop, { continued: true });
        doc.text('Clientes', clientsX, tableTop);
        doc.moveDown();

        doc.strokeColor("#cccccc").lineWidth(1).moveTo(dateX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
        doc.moveDown();

        doc.font('Helvetica').fontSize(9);

        for (const log of logs) {
            const clientsText = log.clientes.map(c => c.name).join(', ');
            const rowHeight = Math.max(
                doc.heightOfString(log.subject, { width: 150 }),
                doc.heightOfString(clientsText, { width: clientsWidth })
            );
            if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }

            const y = doc.y;
            doc.text(new Date(log.createdAt).toLocaleString('pt-BR'), dateX, y, { width: 90 });
            doc.text(log.subject, subjectX, y, { width: 150 });
            doc.text(log.template.name, templateX, y, { width: 90 });
            doc.text(log.submittedByUser.name, sentByX, y, { width: 110 });
            doc.text(log.status, statusX, y, { width: 60 });
            doc.text(clientsText, clientsX, y, { width: clientsWidth });

            doc.y += rowHeight + 10;
            doc.strokeColor("#eeeeee").lineWidth(0.5).moveTo(dateX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
            doc.moveDown(2);
        }

        await addWatermark(doc);
        addFooter(doc);
        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF de notificações:", error);
        response.status(500).json({ message: "Erro ao gerar relatório PDF de notificações." });
    }
};