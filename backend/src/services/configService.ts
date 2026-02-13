// Capa de Servicios - Lógica de Negocio para Configuración
import { couchdbService } from './couchdbService.js';

export class ConfigService {
  static async getConfig(): Promise<{ 
    couchdbUrl?: string;
    couchdbProxyUrl?: string;
    connectionStatus?: { connected: boolean; error?: string };
  }> {
    const couchdbUrl = process.env.COUCHDB_URL || undefined;
    const couchdbProxyUrl = '/api/couchdb';
    
    // Check connection status
    let connectionStatus;
    try {
      connectionStatus = await couchdbService.getConnectionStatus();
    } catch (error) {
      connectionStatus = { connected: false, error: 'Unable to check connection' };
    }

    return {
      couchdbUrl,
      couchdbProxyUrl,
      connectionStatus
    };
  }
}

