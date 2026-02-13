// Capa de Servicios - Servicio de Sincronización con CouchDB
import PouchDB from 'pouchdb';
import { ApiService } from './api';
import { db } from '../db';

export interface SyncStatus {
  active: boolean;
  syncing: boolean;
  lastSync?: Date;
  error?: string;
  pending?: number;
}

export type CouchDBStatusListener = (connected: boolean) => void;

export class SyncService {
  private syncHandle: PouchDB.Replication.Sync<{}> | null = null;
  private status: SyncStatus = {
    active: false,
    syncing: false
  };
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private couchdbStatusListeners: CouchDBStatusListener[] = [];
  private isOnline: boolean = navigator.onLine;
  private reconnectTimer: number | null = null;
  private couchdbPollingInterval: number | null = null;
  private previousCouchDBConnected: boolean | null = null;
  private _couchdbConnected: boolean = false;

  async startSync(): Promise<void> {
    if (this.syncHandle) {
      console.log('Sync already active');
      return;
    }

    try {
      // Get CouchDB proxy URL from backend
      const config = await ApiService.getConfig();
      const remoteUrl = config.couchdbProxyUrl 
        ? `${window.location.origin}${config.couchdbProxyUrl}`
        : undefined;

      if (!remoteUrl) {
        throw new Error('CouchDB proxy URL not configured');
      }

      // Create remote PouchDB instance pointing to backend proxy
      const remoteDb = new PouchDB(remoteUrl, {
        skip_setup: true
      });

      // Get local PouchDB instance
      const localDb = db.getPouchDB();

      // Start bidirectional sync
      this.syncHandle = localDb.sync(remoteDb, {
        live: true,
        retry: true,
        back_off_function: (delay) => {
          if (delay === 0) {
            return 1000;
          }
          return Math.min(delay * 2, 30000);
        }
      });

      this.status.active = true;
      this.updateStatus();

      // Listen to sync events
      this.syncHandle
        .on('change', (info) => {
          console.log('Sync change:', info);
          this.status.syncing = true;
          this.updateStatus();
        })
        .on('paused', () => {
          console.log('Sync paused');
          this.status.syncing = false;
          this.status.lastSync = new Date();
          this.updateStatus();
        })
        .on('active', () => {
          console.log('Sync active');
          this.status.syncing = true;
          this.status.error = undefined;
          this.updateStatus();
        })
        .on('error', (error) => {
          console.error('Sync error:', error);
          this.status.error = error.message || 'Sync error occurred';
          this.status.syncing = false;
          this.updateStatus();
        })
        .on('complete', (info) => {
          console.log('Sync complete:', info);
          this.status.syncing = false;
          this.status.lastSync = new Date();
          this.status.error = undefined;
          this.updateStatus();
        });

      console.log('✅ Sync started successfully');
    } catch (error: any) {
      console.error('❌ Error starting sync:', error);
      this.status.error = error.message || 'Failed to start sync';
      this.status.active = false;
      this.updateStatus();
      throw error;
    }
  }

  stopSync(): void {
    if (this.syncHandle) {
      this.syncHandle.cancel();
      this.syncHandle = null;
      this.status.active = false;
      this.status.syncing = false;
      this.updateStatus();
      console.log('Sync stopped');
    }
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  private updateStatus(): void {
    this.statusListeners.forEach(listener => {
      try {
        listener({ ...this.status });
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  async checkRemoteConnection(): Promise<boolean> {
    try {
      const status = await ApiService.getSyncStatus();
      return status.connected;
    } catch (error) {
      return false;
    }
  }

  // Initialize auto-reconnect on online/offline events
  initAutoReconnect(): void {
    // Listen to browser online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Network: Online');
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network: Offline');
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });

    // Listen to Electron online status changes if available
    if (window.electronAPI?.onOnlineStatusChanged) {
      window.electronAPI.onOnlineStatusChanged((isOnline: boolean) => {
        console.log(`🌐 Electron Network: ${isOnline ? 'Online' : 'Offline'}`);
        this.isOnline = isOnline;
        this.handleOnlineStatusChange(isOnline);
      });
    }

    // Initial sync attempt if online
    if (this.isOnline) {
      this.attemptSync();
    }
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    if (isOnline) {
      // Clear any pending reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Attempt to sync when coming online
      this.attemptSync();
    } else {
      // Stop sync when going offline
      if (this.syncHandle) {
        console.log('⏸️ Pausing sync due to network offline');
        this.stopSync();
      }
    }
  }

  private async attemptSync(): Promise<void> {
    try {
      // Wait a moment before attempting sync (debounce rapid changes)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Only attempt if still online
      if (!this.isOnline) return;

      // Check if remote is actually reachable
      const isReachable = await this.checkRemoteConnection();
      
      if (isReachable) {
        console.log('✅ Remote CouchDB is reachable, starting sync...');
        await this.startSync();
      } else {
        console.log('⚠️ Remote CouchDB not reachable, will retry...');
        this.scheduleReconnect();
      }
    } catch (error) {
      console.error('❌ Failed to attempt sync:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    // Schedule a reconnect attempt in 30 seconds
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      if (this.isOnline) {
        console.log('🔄 Retrying sync connection...');
        this.attemptSync();
      }
    }, 30000); // 30 seconds
  }

  // CouchDB real-time status polling
  get couchdbConnected(): boolean {
    return this._couchdbConnected;
  }

  startCouchDBPolling(): void {
    if (this.couchdbPollingInterval) return;

    // Poll immediately, then every 10 seconds
    this.pollCouchDBStatus();
    this.couchdbPollingInterval = window.setInterval(() => {
      this.pollCouchDBStatus();
    }, 10000);

    console.log('🔄 CouchDB status polling started (every 10s)');
  }

  stopCouchDBPolling(): void {
    if (this.couchdbPollingInterval) {
      clearInterval(this.couchdbPollingInterval);
      this.couchdbPollingInterval = null;
    }
  }

  private async pollCouchDBStatus(): Promise<void> {
    try {
      const status = await ApiService.getSyncStatus();
      const connected = status.connected;

      // Detect transition
      if (this.previousCouchDBConnected !== null && this.previousCouchDBConnected !== connected) {
        console.log(`🔄 CouchDB status changed: ${this.previousCouchDBConnected ? 'connected' : 'disconnected'} -> ${connected ? 'connected' : 'disconnected'}`);
        this.notifyCouchDBStatusListeners(connected);

        if (connected && !this.syncHandle) {
          // Reconnected - attempt to start sync
          this.attemptSync();
        }
      } else if (this.previousCouchDBConnected === null) {
        // First check - notify initial state
        this.notifyCouchDBStatusListeners(connected);
      }

      this.previousCouchDBConnected = connected;
      this._couchdbConnected = connected;
    } catch (error) {
      // Backend unreachable - treat as disconnected
      if (this.previousCouchDBConnected !== false) {
        this._couchdbConnected = false;
        this.previousCouchDBConnected = false;
        this.notifyCouchDBStatusListeners(false);
      }
    }
  }

  onCouchDBStatusChange(listener: CouchDBStatusListener): () => void {
    this.couchdbStatusListeners.push(listener);
    return () => {
      const index = this.couchdbStatusListeners.indexOf(listener);
      if (index > -1) {
        this.couchdbStatusListeners.splice(index, 1);
      }
    };
  }

  private notifyCouchDBStatusListeners(connected: boolean): void {
    this.couchdbStatusListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in CouchDB status listener:', error);
      }
    });
  }
}

// Singleton instance
export const syncService = new SyncService();

// Initialize auto-reconnect when module loads
if (typeof window !== 'undefined') {
  syncService.initAutoReconnect();
}
