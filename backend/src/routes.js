// Arquivo: backend/src/routes.js
const { Router } = require('express');
const TemplateController = require('./controllers/TemplateController');
const NotificationController = require('./controllers/NotificationController');
const authMiddleware = require('./middleware/auth');

const routes = Router();

// Rotas de Template
routes.get('/templates', authMiddleware, TemplateController.index);
routes.post('/templates', authMiddleware, TemplateController.create);
routes.put('/templates/:id', authMiddleware, TemplateController.update);
routes.delete('/templates/:id', authMiddleware, TemplateController.destroy);

// --- ROTAS DE NOTIFICAÇÃO ATUALIZADAS ---
// Rota para um analista submeter uma notificação
routes.post('/notifications/submit', authMiddleware, NotificationController.submit);

// Rota para um aprovador listar todas as notificações
routes.get('/notifications', authMiddleware, NotificationController.index);

// Rota para um aprovador aprovar uma notificação específica
routes.post('/notifications/:id/approve', authMiddleware, NotificationController.approve);
routes.get('/notifications/:id', authMiddleware, NotificationController.show);
routes.post('/notifications/:id/reject', authMiddleware, NotificationController.reject);
module.exports = routes;