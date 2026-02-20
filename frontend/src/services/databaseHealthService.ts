// Database Health Service - Monitor database connection status
import { API_BASE } from './api';

export interface DatabaseHealth {
  connected: boolean;
  readable: boolean;
  writable: boolean;
  latency?: number;
  error?: string;
  timestamp: string;
  cachedUntil?: number;
}

export type DatabaseStatus = 'connected' | 'syncing' | 'disconnected';

export class DatabaseHealthService {
  private static lastCheck: DatabaseHealth | null = null;
  private static cacheDuration = 3000; // 3 seconds cache
  private static listeners: ((status: DatabaseStatus, health: DatabaseHealth) => void)[] = [];
  private static currentStatus: DatabaseStatus = 'disconnected';

  /**
   * Check database health - uses cache if available
   */
  static async checkHealth(forceRefresh: boolean = false): Promise<DatabaseHealth> {
    const now = Date.now();
    
    // Return cached result if valid and not forcing refresh
    if (!forceRefresh && this.lastCheck && this.lastCheck.cachedUntil && this.lastCheck.cachedUntil > now) {
      return this.lastCheck;
    }

    try {
      const response = await fetch(`${API_BASE}/couchdb/health`);
      const health: DatabaseHealth = await response.json();
      
      // Add cache expiration
      health.cachedUntil = now + this.cacheDuration;
      this.lastCheck = health;
      
      // Determine status
      const newStatus = this.determineStatus(health);
      
      // Notify listeners if status changed
      if (newStatus !== this.currentStatus) {
        this.currentStatus = newStatus;
        this.notifyListeners(newStatus, health);
      }
      
      return health;
    } catch (error: any) {
      const health: DatabaseHealth = {
        connected: false,
        readable: false,
        writable: false,
        error: error.message || 'Network error',
        timestamp: new Date().toISOString(),
        cachedUntil: now + this.cacheDuration
      };
      
      this.lastCheck = health;
      
      const newStatus: DatabaseStatus = 'disconnected';
      if (newStatus !== this.currentStatus) {
        this.currentStatus = newStatus;
        this.notifyListeners(newStatus, health);
      }
      
      return health;
    }
  }

  /**
   * Determine database status from health check
   */
  private static determineStatus(health: DatabaseHealth): DatabaseStatus {
    if (!health.connected || !health.readable) {
      return 'disconnected';
    }
    return 'connected';
  }

  /**
   * Subscribe to status changes
   */
  static onStatusChange(listener: (status: DatabaseStatus, health: DatabaseHealth) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    if (this.lastCheck) {
      listener(this.currentStatus, this.lastCheck);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private static notifyListeners(status: DatabaseStatus, health: DatabaseHealth): void {
    this.listeners.forEach(listener => {
      try {
        listener(status, health);
      } catch (error) {
        console.error('Error in health status listener:', error);
      }
    });
  }

  /**
   * Get current status
   */
  static getCurrentStatus(): DatabaseStatus {
    return this.currentStatus;
  }

  /**
   * Get last health check result
   */
  static getLastHealth(): DatabaseHealth | null {
    return this.lastCheck;
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.lastCheck = null;
  }
}
