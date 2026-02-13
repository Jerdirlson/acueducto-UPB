// Electron API Type Definitions for Renderer Process
// These types match the APIs exposed in electron/preload.ts

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
    electronAPI?: ElectronAPI;
  }
}

export {};
