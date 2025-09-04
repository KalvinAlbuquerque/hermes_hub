// Arquivo: backend/src/routes.js
const { Router } = require('express');
const TemplateController = require('./controllers/TemplateController');
const NotificationController = require('./controllers/NotificationController');
const DashboardController = require('./controllers/DashboardController');
const authMiddleware = require('./middleware/auth');
const AttachmentController = require('./controllers/AttachmentController'); // <-- Garante que está importado
const MfaController = require('./controllers/MfaController'); 
const { can } = require('./middleware/permissions');
const routes = Router();

// Rota do Dashboard
routes.get('/dashboard/stats', authMiddleware, DashboardController.getStats);

// --- ALTERAÇÃO 2: ADICIONA A ROTA PARA IMAGENS COLADAS <<<< ---
routes.post('/attachments/paste', authMiddleware, AttachmentController.handlePaste);

// Rotas de Template
routes.get('/templates', authMiddleware, can('templates:read'), TemplateController.index);
routes.post('/templates', authMiddleware, can('templates:write'), TemplateController.create);
routes.put('/templates/:id', authMiddleware, can('templates:write'), TemplateController.update);
routes.delete('/templates/:id', authMiddleware, can('templates:delete'), TemplateController.destroy);

// Rotas de Ação de Notificação
routes.post('/notifications/submit', authMiddleware, can('notifications:send'), AttachmentController.handleUpload, NotificationController.submit);
routes.post('/notifications/:id/approve', authMiddleware, can('notifications:approve'), NotificationController.approve);
routes.post('/notifications/:id/reject', authMiddleware, can('notifications:approve'), NotificationController.reject);
// --- ROTAS DE MFA ---
routes.post('/mfa/setup', authMiddleware, MfaController.setup);
routes.post('/mfa/verify', authMiddleware, MfaController.verifyAndEnable);

module.exports = routes;