// Electron Environment Type Definitions
// Type definitions for Electron APIs exposed to renderer

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

export {};
