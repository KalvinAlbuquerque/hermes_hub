// Arquivo: backend/src/routes.js
const { Router } = require('express');
const TemplateController = require('./controllers/TemplateController');
const NotificationController = require('./controllers/NotificationController');
const DashboardController = require('./controllers/DashboardController');
const authMiddleware = require('./middleware/auth');
const AttachmentController = require('./controllers/AttachmentController'); // <-- Garante que está importado

const routes = Router();

// Rota do Dashboard
routes.get('/dashboard/stats', authMiddleware, DashboardController.getStats);

// --- ALTERAÇÃO 2: ADICIONA A ROTA PARA IMAGENS COLADAS <<<< ---
routes.post('/attachments/paste', authMiddleware, AttachmentController.handlePaste);

// Rotas de Template
routes.get('/templates', authMiddleware, TemplateController.index);
routes.post('/templates', authMiddleware, TemplateController.create);
routes.put('/templates/:id', authMiddleware, TemplateController.update);
routes.delete('/templates/:id', authMiddleware, TemplateController.destroy);

// Rotas de Ação de Notificação
routes.post('/notifications/submit', authMiddleware, AttachmentController.handleUpload, NotificationController.submit);
routes.post('/notifications/:id/approve', authMiddleware, NotificationController.approve);
routes.post('/notifications/:id/reject', authMiddleware, NotificationController.reject);

module.exports = routes;