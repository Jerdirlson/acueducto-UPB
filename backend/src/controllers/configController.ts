// Capa de Controladores - Controlador de Configuración
import { Request, Response } from 'express';
import { ConfigService } from '../services/configService';

export class ConfigController {
  static async get(req: Request, res: Response): Promise<void> {
    try {
      const config = await ConfigService.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get config' });
    }
  }
}

