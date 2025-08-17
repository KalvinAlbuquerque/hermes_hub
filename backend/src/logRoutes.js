// Arquivo: backend/src/logRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const NotificationLogController = require('./controllers/NotificationLogController');
const AuditLogController = require('./controllers/AuditLogController');
const ReportController = require('./controllers/ReportController');

const logRoutes = Router();
logRoutes.use(authMiddleware);

// Rotas de logs de auditoria
logRoutes.get('/audit-logs/actions', AuditLogController.getDistinctActions);

// Rotas de logs de notificação
logRoutes.get('/logs/notifications', NotificationLogController.index);
logRoutes.get('/logs/notifications/:id', NotificationLogController.show);
logRoutes.get('/logs/notifications/export/csv', ReportController.generateNotificationLogsCSV);
logRoutes.get('/logs/notifications/export/pdf', ReportController.generateNotificationLogsPDF);
logRoutes.post('/logs/notifications/:id/close', NotificationLogController.closeIncident);
module.exports = logRoutes;