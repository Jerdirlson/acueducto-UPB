// Capa de Controladores - Controlador de Health Check
import { Request, Response } from 'express';

export class HealthController {
  static async check(req: Request, res: Response): Promise<void> {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}

