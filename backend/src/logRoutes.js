// backend/src/logRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const NotificationLogController = require('./controllers/NotificationLogController');
const AuditLogController = require('./controllers/AuditLogController');
const ReportController = require('./controllers/ReportController');

const logRoutes = Router();
logRoutes.use(authMiddleware);

logRoutes.get('/audit-logs/actions', AuditLogController.getDistinctActions);

logRoutes.get('/logs/notifications', NotificationLogController.index);
logRoutes.get('/logs/notifications/:id', NotificationLogController.show);
logRoutes.get('/logs/notifications/export/csv', ReportController.generateNotificationLogsCSV);
logRoutes.get('/logs/notifications/export/pdf', ReportController.generateNotificationLogsPDF);
logRoutes.post('/logs/notifications/:id/close', NotificationLogController.closeIncident);
logRoutes.post('/logs/notifications/:id/reopen', NotificationLogController.reopenIncident); // NOVA ROTA
logRoutes.get('/logs/notifications/:id/reminders', NotificationLogController.getReminders);

module.exports = logRoutes;