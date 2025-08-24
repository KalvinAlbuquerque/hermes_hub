// backend/src/logRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const NotificationLogController = require('./controllers/NotificationLogController');
const AuditLogController = require('./controllers/AuditLogController');
const ReportController = require('./controllers/ReportController');

const logRoutes = Router();
logRoutes.use(authMiddleware);

// Rotas de Auditoria
logRoutes.get('/audit-logs/actions', AuditLogController.getDistinctActions);

// Rotas de Notificação e Incidentes
logRoutes.get('/logs/notifications', NotificationLogController.index);
logRoutes.get('/logs/notifications/my-replies', NotificationLogController.getRecentRepliesForUser); // Rota para o sino
logRoutes.post('/logs/notifications/mark-replies-as-read', NotificationLogController.markRepliesAsRead); // Rota para marcar como lido
logRoutes.get('/logs/notifications/:id', NotificationLogController.show);
logRoutes.get('/logs/notifications/export/csv', ReportController.generateNotificationLogsCSV);
logRoutes.get('/logs/notifications/export/pdf', ReportController.generateNotificationLogsPDF);
logRoutes.post('/logs/notifications/:id/close', NotificationLogController.closeIncident);
logRoutes.get('/logs/notifications/:id/reminders', NotificationLogController.getReminders);
logRoutes.post('/logs/notifications/:id/pause', NotificationLogController.pauseIncident);
logRoutes.post('/logs/notifications/:id/reopen', NotificationLogController.reopenIncident); 
logRoutes.post('/logs/notifications/:id/send-reminder', NotificationLogController.sendManualReminder);

module.exports = logRoutes;