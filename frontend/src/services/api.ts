// Capa de Servicios - Comunicación con Backend API
const API_BASE = '/api';

export class ApiService {
  static async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  static async getConfig(): Promise<{ couchdbUrl?: string }> {
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) throw new Error('Failed to get config');
    return response.json();
  }

  static async downloadBackup(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/backup`);
    if (!response.ok) throw new Error('Failed to download backup');
    return response.blob();
  }

  static async uploadBackup(file: File): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('backup', file);
    
    const response = await fetch(`${API_BASE}/restore`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to restore backup');
    return response.json();
  }
}

