// Capa de Servicios - Comunicación con Backend API
import { AuthService } from './authService';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:3000/api'
  : '/api';

export class ApiService {
  static async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  static async getConfig(): Promise<{
    couchdbUrl?: string;
    couchdbProxyUrl?: string;
    connectionStatus?: { connected: boolean; error?: string };
  }> {
    const response = await AuthService.authFetch(`${API_BASE}/config`);
    if (!response.ok) throw new Error('Failed to get config');
    return response.json();
  }

  static async getSyncStatus(): Promise<{ connected: boolean; lastChecked: string | null; error: string | null }> {
    const response = await AuthService.authFetch(`${API_BASE}/couchdb/sync-status`);
    if (!response.ok) throw new Error('Failed to get sync status');
    return response.json();
  }

  static async downloadBackup(): Promise<Blob> {
    const response = await AuthService.authFetch(`${API_BASE}/backup`);
    if (!response.ok) throw new Error('Failed to download backup');
    return response.blob();
  }

  static async uploadBackup(file: File): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append('backup', file);

    const token = AuthService.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/restore`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) throw new Error('Failed to restore backup');
    return response.json();
  }
}

