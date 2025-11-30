// Capa de Servicios - Lógica de Negocio para Configuración
export class ConfigService {
  static async getConfig(): Promise<{ couchdbUrl?: string }> {
    // En producción, esto podría leer de variables de entorno o archivo de configuración
    return {
      couchdbUrl: process.env.COUCHDB_URL || undefined
    };
  }
}

