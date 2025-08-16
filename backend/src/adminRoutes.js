// Arquivo: backend/src/adminRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const ProfileController = require('./controllers/ProfileController');
const UserController = require('./controllers/UserController'); // 1. Importa o UserController
const AuditLogController = require('./controllers/AuditLogController');
const adminRoutes = Router();

adminRoutes.use(authMiddleware);

// Rotas para Perfis (Profiles)
adminRoutes.post('/profiles', ProfileController.create);
adminRoutes.get('/profiles', ProfileController.index);
adminRoutes.put('/profiles/:id', ProfileController.update);
adminRoutes.delete('/profiles/:id', ProfileController.destroy);

// --- NOVAS ROTAS PARA USUÁRIOS (USERS) ---
adminRoutes.get('/users', UserController.index);
adminRoutes.put('/users/:id', UserController.update);
// A rota POST /users já existe em legacyRoutes, por isso não a adicionamos aqui.

adminRoutes.get('/audit-logs', AuditLogController.index);

module.exports = adminRoutes;