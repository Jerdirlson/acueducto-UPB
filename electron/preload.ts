// Electron Preload Script
// Infrastructure Layer - Secure bridge between main and renderer processes

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Get current online status
  getOnlineStatus: (): Promise<boolean> => {
    return ipcRenderer.invoke('get-online-status');
  },

  // Listen to online status changes
  onOnlineStatusChanged: (callback: (isOnline: boolean) => void) => {
    const subscription = (_event: any, isOnline: boolean) => callback(isOnline);
    ipcRenderer.on('online-status-changed', subscription);
    
    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('online-status-changed', subscription);
    };
  },

  // Get app version
  getAppVersion: (): Promise<string> => {
    return ipcRenderer.invoke('get-app-version');
  },

  // Get app paths
  getAppPath: (name: string): Promise<string> => {
    return ipcRenderer.invoke('get-app-path', name);
  },

  // Platform information
  platform: process.platform,
  isElectron: true,
});

// Type definitions for TypeScript
export interface ElectronAPI {
  getOnlineStatus: () => Promise<boolean>;
  onOnlineStatusChanged: (callback: (isOnline: boolean) => void) => () => void;
  getAppVersion: () => Promise<string>;
  getAppPath: (name: string) => Promise<string>;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
