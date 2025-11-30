// Capa de Rutas - Definición de Endpoints
import { Router } from 'express';
import { HealthController } from '../controllers/healthController';
import { ConfigController } from '../controllers/configController';
import { BackupController } from '../controllers/backupController';

const router = Router();

// Health check
router.get('/health', HealthController.check);

// Config
router.get('/config', ConfigController.get);

// Backup
router.get('/backup', BackupController.download);
router.post('/restore', BackupController.restore);

export default router;

