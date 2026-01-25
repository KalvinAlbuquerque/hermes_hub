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
            // --- ALTERAÇÃO AQUI: Incluindo a categoria do template ---
            template: {
                select: {
                    name: true,
                    category: { select: { name: true } }
                }
            },
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
            Categoria: log.template.category?.name || 'N/A', // <-- NOVA COLUNA
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

        // --- As funções de cabeçalho, rodapé e marca d'água são reutilizadas ---
        await addHeader(doc);

        doc.fontSize(16).font('Helvetica-Bold').text('Relatório de Notificações', { align: 'center' });
        doc.moveDown(2);

        // --- LAYOUT DA TABELA COMPLETAMENTE REFEITO ---
        const tableTop = doc.y;
        const columnSpacing = 10;

        // Definição das posições e larguras das colunas
        const dateX = doc.page.margins.left;
        const subjectX = dateX + 90;
        const templateX = subjectX + 150;
        const categoryX = templateX + 90;
        const sentByX = categoryX + 90;
        const statusX = sentByX + 90;
        const clientsX = statusX + 50;

        const dateWidth = 80;
        const subjectWidth = 140;
        const templateWidth = 80;
        const categoryWidth = 80;
        const sentByWidth = 80;
        const statusWidth = 40;
        const clientsWidth = doc.page.width - doc.page.margins.right - clientsX;

        // Cabeçalhos da Tabela
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Data', dateX, tableTop);
        doc.text('Assunto', subjectX, tableTop);
        doc.text('Template', templateX, tableTop);
        doc.text('Categoria', categoryX, tableTop);
        doc.text('Enviado Por', sentByX, tableTop);
        doc.text('Status', statusX, tableTop);
        doc.text('Clientes', clientsX, tableTop);
        doc.moveDown(0.5);

        // Linha divisória
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(dateX, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
        doc.moveDown();

        // Conteúdo da Tabela
        doc.font('Helvetica').fontSize(8);
        for (const log of logs) {
            const clientsText = log.clientes.map(c => c.name).join(', ');
            // Calcula a altura da linha com base no maior texto
            const rowHeight = Math.max(
                doc.heightOfString(log.subject, { width: subjectWidth }),
                doc.heightOfString(clientsText, { width: clientsWidth }),
                15 // Altura mínima
            );

            // Adiciona nova página se não houver espaço
            if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
            }

            const y = doc.y;
            doc.text(new Date(log.createdAt).toLocaleString('pt-BR'), dateX, y, { width: dateWidth });
            doc.text(log.subject, subjectX, y, { width: subjectWidth });
            doc.text(log.template.name, templateX, y, { width: templateWidth });
            doc.text(log.template.category?.name || 'N/A', categoryX, y, { width: categoryWidth });
            doc.text(log.submittedByUser.name, sentByX, y, { width: sentByWidth });
            doc.text(log.status, statusX, y, { width: statusWidth });
            doc.text(clientsText, clientsX, y, { width: clientsWidth });

            doc.y += rowHeight + 5; // Pula para a próxima linha
        }
        // --- FIM DO LAYOUT REFEITO ---

        await addWatermark(doc);
        addFooter(doc);
        doc.end();
    } catch (error) {
        console.error("Erro ao gerar PDF de notificações:", error);
        response.status(500).json({ message: "Erro ao gerar relatório PDF de notificações." });
    }
};

// --- LÓGICA PARA RELATÓRIO GERAL DE CLIENTES ---

async function getGeneralReportData(queryParams) {
    const { startDate, endDate } = queryParams;
    const where = {};

    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.createdAt = { ...where.createdAt, lte: nextDay };
    }

    // Busca todas as notificações no período com seus clientes e template (para categoria)
    const logs = await prisma.notificationLog.findMany({
        where,
        include: {
            clientes: { select: { id: true, name: true } },
            template: {
                select: {
                    category: { select: { name: true } }
                }
            }
        }
    });

    // Agregação dos dados
    const clientStats = {};

    logs.forEach(log => {
        const categoryName = log.template?.category?.name || 'Sem Categoria';

        log.clientes.forEach(cliente => {
            if (!clientStats[cliente.id]) {
                clientStats[cliente.id] = {
                    name: cliente.name,
                    totalIncidents: 0,
                    categories: {}
                };
            }

            // Incrementa total geral do cliente
            clientStats[cliente.id].totalIncidents++;

            // Incrementa contagem por categoria para este cliente
            if (!clientStats[cliente.id].categories[categoryName]) {
                clientStats[cliente.id].categories[categoryName] = 0;
            }
            clientStats[cliente.id].categories[categoryName]++;
        });
    });

    // Converte objeto para array e ordena por total de incidentes (decrescente)
    return Object.values(clientStats).sort((a, b) => b.totalIncidents - a.totalIncidents);
}

module.exports.generateGeneralReportPDF = async (request, response) => {
    try {
        const clientsData = await getGeneralReportData(request.query);
        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

        response.header('Content-Type', 'application/pdf');
        doc.pipe(response);

        await addHeader(doc);

        doc.fontSize(16).font('Helvetica-Bold').text('Relatório Geral de Clientes', { align: 'center' });
        doc.moveDown(1);

        doc.fontSize(10).font('Helvetica').text(
            `Período: ${request.query.startDate ? new Date(request.query.startDate).toLocaleDateString('pt-BR') : 'Início'} até ${request.query.endDate ? new Date(request.query.endDate).toLocaleDateString('pt-BR') : 'Hoje'}`,
            { align: 'center' }
        );
        doc.moveDown(2);


        // --- SEÇÃO 1: RESUMO QUANTITATIVO GERAL ---
        doc.fontSize(12).font('Helvetica-Bold').text('1. Resumo Quantitativo Geral', { underline: true });
        doc.moveDown(0.5);

        const summaryTableTop = doc.y;
        const col1X = doc.page.margins.left;
        const col2X = col1X + 300;

        // Cabeçalho da Tabela de Resumo
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Cliente', col1X, doc.y);
        doc.text('Total de Notificações', col2X, doc.y);
        doc.moveDown(0.5);
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(col1X, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
        doc.moveDown(0.5);

        // Corpo da Tabela de Resumo
        doc.fontSize(10).font('Helvetica');
        for (const client of clientsData) {
            if (doc.y > doc.page.height - doc.page.margins.bottom - 20) doc.addPage();

            const y = doc.y;
            doc.text(client.name, col1X, y);
            doc.text(client.totalIncidents.toString(), col2X, y);
            doc.moveDown(0.8);
        }

        doc.moveDown(2);


        // --- SEÇÃO 2: DETALHAMENTO POR CATEGORIA ---
        // Verifica se cabe na página atual, senão quebra
        if (doc.y > doc.page.height - 200) doc.addPage();

        doc.fontSize(12).font('Helvetica-Bold').text('2. Detalhamento de Categorias por Cliente', { underline: true });
        doc.moveDown(1);

        for (const client of clientsData) {
            // Verifica espaço para o bloco do cliente (Título + algumas linhas)
            if (doc.y + 100 > doc.page.height - doc.page.margins.bottom) doc.addPage();

            // Nome do Cliente em Destaque
            doc.fontSize(11).fillColor('#2d3748').font('Helvetica-Bold').text(client.name);
            doc.moveDown(0.3);

            // Tabela de Categorias para este cliente
            // Cabeçalho Interno
            const catX = doc.page.margins.left + 20; // Indentado
            const countX = catX + 250;

            doc.fontSize(9).fillColor('black').font('Helvetica-Bold');
            doc.text('Categoria', catX, doc.y);
            doc.text('Apps/Incidentes', countX, doc.y);
            doc.moveDown(0.3);
            doc.strokeColor("#eeeeee").lineWidth(1).moveTo(catX, doc.y).lineTo(countX + 100, doc.y).stroke();
            doc.moveDown(0.5);

            // Lista de Categorias
            doc.font('Helvetica');
            const sortedCategories = Object.entries(client.categories).sort(([, a], [, b]) => b - a);

            for (const [category, count] of sortedCategories) {
                if (doc.y > doc.page.height - doc.page.margins.bottom) doc.addPage();

                const y = doc.y;
                doc.text(category, catX, y);
                doc.text(count.toString(), countX, y);
                doc.moveDown(0.5);
            }
            doc.moveDown(1); // Espaço entre clientes
        }

        await addWatermark(doc);
        addFooter(doc);
        doc.end();

    } catch (error) {
        console.error("Erro ao gerar Relatório Geral:", error);
        response.status(500).json({ message: "Erro ao gerar Relatório Geral." });
    }
};
