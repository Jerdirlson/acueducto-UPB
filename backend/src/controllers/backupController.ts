// Capa de Controladores - Controlador de Respaldo
import { Request, Response } from 'express';
import { BackupService } from '../services/backupService';

export class BackupController {
  static async download(req: Request, res: Response): Promise<void> {
    try {
      const backup = await BackupService.generateBackup();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=respaldo_acueducto_${new Date().toISOString().split('T')[0]}.json`);
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate backup' });
    }
  }

  static async restore(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body || !req.body.data) {
        res.status(400).json({ error: 'No backup data provided' });
        return;
      }
      
      await BackupService.restoreBackup(req.body.data);
      res.json({ success: true, message: 'Backup restored successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to restore backup' });
    }
  }
}

