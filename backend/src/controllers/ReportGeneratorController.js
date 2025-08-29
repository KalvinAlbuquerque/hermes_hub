// Arquivo: backend/src/controllers/ReportGeneratorController.js
const prisma = require('../database/prisma');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Funções auxiliares de PDF (reutilizadas e adaptadas do seu ReportController.js)
async function addHeader(doc) {
    const companyLogoSetting = await prisma.systemSetting.findUnique({ where: { key: 'companyLogo' } });
    let logoPath;

    if (companyLogoSetting && companyLogoSetting.value && fs.existsSync(path.join(__dirname, '..', '..', 'public', companyLogoSetting.value))) {
        logoPath = path.join(__dirname, '..', '..', 'public', companyLogoSetting.value);
    } else {
        logoPath = path.join(__dirname, '..', '..', 'public', 'attachments', '1755458303755-712784618-hermes-logo-glow.png.png');
    }
    
    doc.image(logoPath, doc.page.margins.left, 25, { height: 40 });
    const generatedAt = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    doc.fontSize(8).text(generatedAt, { align: 'right' });
    doc.moveDown(3);
}

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

// Lógica de Geração de Relatórios
module.exports = {
  // Relatório 1: Categorias mais notificadas por cliente
  async generateCategoriesByClientReport(request, response) {
    const { startDate, endDate } = request.body;

    try {
      const data = await prisma.notificationLog.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          // Garante que a notificação tenha clientes e categorias associadas
          clientes: { some: {} },
          template: { categoryId: { not: null } },
        },
        select: {
          clientes: { select: { name: true } },
          template: { select: { category: { select: { name: true } } } },
        },
      });

      // Processa os dados para agrupar
      const reportData = data.reduce((acc, log) => {
        const categoryName = log.template.category.name;
        log.clientes.forEach(cliente => {
          if (!acc[cliente.name]) {
            acc[cliente.name] = {};
          }
          if (!acc[cliente.name][categoryName]) {
            acc[cliente.name][categoryName] = 0;
          }
          acc[cliente.name][categoryName]++;
        });
        return acc;
      }, {});

      // Geração do PDF
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      response.header('Content-Type', 'application/pdf');
      doc.pipe(response);

      await addHeader(doc);
      // --- TÍTULO AJUSTADO ---
      doc.fontSize(16).font('Helvetica-Bold').text('Relatório de Notificações por Categoria de Cliente', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'center' });
      doc.moveDown(2);

      for (const clientName in reportData) {
        if (doc.y > 650) doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text(clientName, { underline: true });
        doc.moveDown(0.5);

        const categories = Object.entries(reportData[clientName]).sort(([, countA], [, countB]) => countB - countA);

        categories.forEach(([categoryName, count]) => {
          doc.fontSize(10).font('Helvetica').text(`${categoryName}: `, { continued: true }).font('Helvetica-Bold').text(`${count} notificações`);
        });
        doc.moveDown(1.5);
      }

      addFooter(doc);
      doc.end();

    } catch (error) {
      console.error("Erro ao gerar relatório de categorias por cliente:", error);
      response.status(500).json({ message: "Erro ao gerar relatório." });
    }
  },

  // Relatório 2: Top clientes mais notificados
  async generateTopClientsReport(request, response) {
    const { startDate, endDate } = request.body;
    try {
      const data = await prisma.cliente.findMany({
        where: {
          notificationLogs: {
            some: {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            },
          },
        },
        select: {
          name: true,
          _count: {
            select: {
              notificationLogs: {
                where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
              },
            },
          },
        },
      });

      const sortedData = data
        .map(c => ({ name: c.name, count: c._count.notificationLogs }))
        .sort((a, b) => b.count - a.count);

      // Geração do PDF
      const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
      response.header('Content-Type', 'application/pdf');
      doc.pipe(response);

      await addHeader(doc);
      doc.fontSize(16).font('Helvetica-Bold').text('Relatório de Clientes Mais Notificados', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`, { align: 'center' });
      doc.moveDown(2);
      
      const tableTop = doc.y;
      const posCol = 50;
      const clientCol = 120;
      const notificationsCol = 400;
      const colWidth = doc.page.width - doc.page.margins.right - notificationsCol;

      doc.font('Helvetica-Bold').fontSize(12);
      
      // --- BLOCO DE ALINHAMENTO CORRIGIDO ---
      const drawRow = (y, pos, client, count, font, size) => {
        doc.font(font).fontSize(size);
        doc.text(pos, posCol, y);
        doc.text(client, clientCol, y);
        doc.text(count, notificationsCol, y, { width: colWidth, align: 'right' });
      }

      // Desenha o Cabeçalho
      drawRow(tableTop, 'Posição', 'Cliente', 'Nº de Notificações', 'Helvetica-Bold', 12);
      doc.moveDown(1);
      
      // Desenha as Linhas da Tabela
      doc.font('Helvetica').fontSize(11);
      sortedData.forEach((item, index) => {
          if (doc.y > 700) {
              doc.addPage();
              // Se adicionar uma nova página, redesenhe o cabeçalho
              drawRow(doc.page.margins.top, 'Posição', 'Cliente', 'Nº de Notificações', 'Helvetica-Bold', 12);
              doc.moveDown(1);
          }
          drawRow(doc.y, `${index + 1}º`, item.name, item.count.toString(), 'Helvetica', 11);
          doc.moveDown(1);
      });
      // --- FIM DO BLOCO CORRIGIDO ---
      
      addFooter(doc);
      doc.end();

    } catch (error) {
      console.error("Erro ao gerar relatório de top clientes:", error);
      response.status(500).json({ message: "Erro ao gerar relatório." });
    }
  }
};