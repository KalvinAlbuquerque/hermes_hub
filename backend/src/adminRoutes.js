// Arquivo: backend/src/adminRoutes.js
const { Router } = require('express');
const authMiddleware = require('./middleware/auth');
const { can } = require('./middleware/permissions');
const ProfileController = require('./controllers/ProfileController');
const UserController = require('./controllers/UserController');
const AuditLogController = require('./controllers/AuditLogController');
const ClienteController = require('./controllers/ClienteController');
const ReportController = require('./controllers/ReportController');
const EmailAccountController = require('./controllers/EmailAccountController');
const CompanyController = require('./controllers/CompanyController');
const CategoryController = require('./controllers/CategoryController');
const BackupController = require('./controllers/BackupController');
// CORREÇÃO AQUI: O caminho correto é './validators/userValidator'
const { validate, createUserSchema } = require('./validators/userValidator');
const multer = require('multer');


const upload = multer({ storage: multer.memoryStorage() });

const adminRoutes = Router();
adminRoutes.use(authMiddleware); // Primeiro, garante que o usuário está logado

// Perfis
adminRoutes.post('/profiles', can('profiles:create'), ProfileController.create);
adminRoutes.get('/profiles', can('profiles:read'), ProfileController.index);
adminRoutes.get('/profiles/:id/references', can('profiles:read'), ProfileController.getReferences);
adminRoutes.put('/profiles/:id', can('profiles:update'), ProfileController.update);
adminRoutes.delete('/profiles/:id', can('profiles:delete'), ProfileController.destroy);

// Usuários
adminRoutes.get('/users', can('users:read'), UserController.index);
adminRoutes.post('/users', can('users:create'), validate(createUserSchema), UserController.create);
adminRoutes.put('/users/:id', can('users:update'), UserController.update);
adminRoutes.delete('/users/:id', can('users:delete'), UserController.destroy);
adminRoutes.post('/users/force-change-password', UserController.forceChangePassword);

// Clientes
adminRoutes.post('/clientes', can('clientes:write'), ClienteController.create);
adminRoutes.get('/clientes', can('clientes:read', 'notifications:send'), ClienteController.index);
adminRoutes.put('/clientes/:id', can('clientes:write'), ClienteController.update);
adminRoutes.delete('/clientes/:id', can('clientes:delete'), ClienteController.destroy);

// Contas de E-mail
adminRoutes.post('/email-accounts', can('system:settings'), EmailAccountController.create);
adminRoutes.get('/email-accounts', can('email_accounts:read', 'system:settings', 'notifications:send'), EmailAccountController.index);
adminRoutes.get('/email-accounts/:id', can('system:settings', 'notifications:send'), EmailAccountController.show);
adminRoutes.put('/email-accounts/:id', can('system:settings'), EmailAccountController.update);
adminRoutes.delete('/email-accounts/:id', can('system:settings'), EmailAccountController.destroy);
adminRoutes.post('/email-accounts/test-connection', can('system:settings'), EmailAccountController.testConnection);

// Categorias (agora parte de 'templates:write')
adminRoutes.post('/categories', can('templates:write'), CategoryController.create);
adminRoutes.get('/categories', can('templates:read'), CategoryController.index);
adminRoutes.put('/categories/:id', can('templates:write'), CategoryController.update);
adminRoutes.get('/categories/:id/references', can('templates:read'), CategoryController.getReferences);
adminRoutes.delete('/categories/:id', can('templates:delete'), CategoryController.destroy);

// Gestão da Empresa (agora 'system:settings')
adminRoutes.get('/company/settings', can('system:settings'), CompanyController.getSettings);
adminRoutes.post('/company/settings', can('system:settings'), CompanyController.updateSettings);
adminRoutes.post('/company/logo', can('system:settings'), CompanyController.uploadMiddleware, CompanyController.processLogoUpload);
adminRoutes.post('/company/test-imap', can('system:settings'), CompanyController.testImapConnection);

// Rotas de Relatórios e Auditoria
adminRoutes.get('/audit-logs', can('audit:read'), AuditLogController.index);
adminRoutes.get('/reports/audit-logs/csv', can('audit:read'), ReportController.generateAuditLogsCSV);
adminRoutes.get('/reports/audit-logs/pdf', can('audit:read'), ReportController.generateAuditLogsPDF);

// Rotas de Backup e Restauração
adminRoutes.get('/backup', can('system:backup'), BackupController.createBackup);
adminRoutes.post('/restore', can('system:backup'), upload.single('backupFile'), BackupController.restoreBackup);

module.exports = adminRoutes;