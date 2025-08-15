// Arquivo: backend/src/routes.js
const { Router } = require('express');
const TemplateController = require('./controllers/TemplateController');
const authMiddleware = require('./middleware/auth');
const NotificationController = require('./controllers/NotificationController');
const routes = Router();

// Todas as rotas de template exigirão autenticação
routes.use('/templates', authMiddleware);

routes.post('/templates', TemplateController.create);
routes.get('/templates', TemplateController.index);
routes.put('/templates/:id', TemplateController.update);
routes.delete('/templates/:id', TemplateController.destroy);
routes.post('/notifications/send', authMiddleware, NotificationController.send);
module.exports = routes;