// Capa de Rutas - Definición de Endpoints
import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';
import { ConfigController } from '../controllers/configController.js';
import { BackupController } from '../controllers/backupController.js';
import { CouchDBController } from '../controllers/couchdbController.js';
import { AuthController } from '../controllers/authController.js';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.js';

const router = Router();

// ==========================================
// Rutas Públicas (sin autenticación)
// ==========================================

// Health check
router.get('/health', HealthController.check);

// Auth - Login
router.post('/auth/login', AuthController.login);

// ==========================================
// Rutas Protegidas (requieren autenticación)
// ==========================================

// Auth - Rutas que requieren estar autenticado
router.post('/auth/logout', authenticate, AuthController.logout);
router.get('/auth/verify', authenticate, AuthController.verify);
router.get('/auth/me', authenticate, AuthController.getProfile);
router.post('/auth/change-password', authenticate, AuthController.changePassword);

// Auth - Gestión de usuarios (solo admin)
router.get('/auth/users', authenticate, requireRole('admin'), AuthController.getUsers);
router.post('/auth/users', authenticate, requireRole('admin'), AuthController.createUser);
router.put('/auth/users/:id', authenticate, requireRole('admin'), AuthController.updateUser);
router.delete('/auth/users/:id', authenticate, requireRole('admin'), AuthController.deleteUser);

// Config
router.get('/config', authenticate, ConfigController.get);

// Backup - Lectura para operator y admin, restauración solo admin
router.get('/backup', authenticate, requirePermission('backup:read'), BackupController.download);
router.post('/restore', authenticate, requireRole('admin'), BackupController.restore);

// ==========================================
// CouchDB Proxy - Con permisos por recurso
// ==========================================

// Properties
router.get('/couchdb/properties', authenticate, requirePermission('properties:read'), CouchDBController.getProperties);
router.get('/couchdb/properties/:id', authenticate, requirePermission('properties:read'), CouchDBController.getProperty);
router.post('/couchdb/properties', authenticate, requirePermission('properties:create'), CouchDBController.createProperty);
router.put('/couchdb/properties/:id', authenticate, requirePermission('properties:update'), CouchDBController.updateProperty);
router.delete('/couchdb/properties/:id', authenticate, requireRole('admin'), CouchDBController.deleteProperty);

// Payments
router.get('/couchdb/payments', authenticate, requirePermission('payments:read'), CouchDBController.getPayments);
router.get('/couchdb/payments/:id', authenticate, requirePermission('payments:read'), CouchDBController.getPayment);
router.post('/couchdb/payments', authenticate, requirePermission('payments:create'), CouchDBController.createPayment);
router.put('/couchdb/payments/:id', authenticate, requirePermission('payments:update'), CouchDBController.updatePayment);
router.delete('/couchdb/payments/:id', authenticate, requireRole('admin'), CouchDBController.deletePayment);

// Incidents
router.get('/couchdb/incidents', authenticate, requirePermission('incidents:read'), CouchDBController.getIncidents);
router.get('/couchdb/incidents/:id', authenticate, requirePermission('incidents:read'), CouchDBController.getIncident);
router.post('/couchdb/incidents', authenticate, requirePermission('incidents:create'), CouchDBController.createIncident);
router.put('/couchdb/incidents/:id', authenticate, requirePermission('incidents:update'), CouchDBController.updateIncident);
router.delete('/couchdb/incidents/:id', authenticate, requireRole('admin'), CouchDBController.deleteIncident);

// Sync status
router.get('/couchdb/sync-status', authenticate, CouchDBController.getSyncStatus);

// Database health check (public for monitoring)
router.get('/couchdb/health', CouchDBController.checkDatabaseHealth);

export default router;

