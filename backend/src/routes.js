// Arquivo: backend/src/routes.js
const { Router } = require('express');
const TemplateController = require('./controllers/TemplateController');
const NotificationController = require('./controllers/NotificationController');
const DashboardController = require('./controllers/DashboardController');
const authMiddleware = require('./middleware/auth');
const AttachmentController = require('./controllers/AttachmentController'); 

const routes = Router();

// Rota do Dashboard
routes.get('/dashboard/stats', authMiddleware, DashboardController.getStats);

// Rotas de Template
routes.get('/templates', authMiddleware, TemplateController.index);
routes.post('/templates', authMiddleware, TemplateController.create);
routes.put('/templates/:id', authMiddleware, TemplateController.update);
routes.delete('/templates/:id', authMiddleware, TemplateController.destroy);

// --- ROTAS DE AÇÃO DE NOTIFICAÇÃO ---
routes.post('/notifications/submit', authMiddleware, AttachmentController.handleUpload, NotificationController.submit); 
routes.post('/notifications/:id/approve', authMiddleware, NotificationController.approve);
routes.post('/notifications/:id/reject', authMiddleware, NotificationController.reject);

module.exports = routes;