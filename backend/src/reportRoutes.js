// Arquivo: backend/src/reportRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const ReportGeneratorController = require('./controllers/ReportGeneratorController');

const reportRoutes = Router();
reportRoutes.use(authMiddleware);

// Novas rotas para os relatórios em PDF
reportRoutes.post('/reports/categories-by-client', ReportGeneratorController.generateCategoriesByClientReport);
reportRoutes.post('/reports/top-clients', ReportGeneratorController.generateTopClientsReport);

module.exports = reportRoutes;