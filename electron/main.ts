// Electron Main Process
// Infrastructure Layer - Handles window lifecycle, backend integration, and IPC

import { app, BrowserWindow, ipcMain, net } from 'electron';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import type { Express } from 'express';
import type { Server } from 'http';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if we're running in a packaged app
const isPackaged = app.isPackaged;

// Resolve paths correctly for both dev and packaged environments
function getAppBasePath(): string {
  if (isPackaged) {
    return path.dirname(app.getAppPath());
  }
  return path.join(__dirname, '..');
}

function getBackendPath(): string {
  if (isPackaged) {
    return path.join(app.getAppPath(), 'backend', 'dist', 'server.js');
  }
  return path.join(__dirname, '..', 'backend', 'dist', 'server.js');
}

function getFrontendDistPath(): string {
  if (isPackaged) {
    return path.join(app.getAppPath(), 'frontend', 'dist');
  }
  return path.join(__dirname, '..', 'frontend', 'dist');
}

function getIconPath(): string {
  if (isPackaged) {
    return path.join(app.getAppPath(), 'frontend', 'dist', 'icons', 'icon-512.png');
  }
  return path.join(__dirname, '..', 'frontend', 'public', 'icons', 'icon-512.png');
}

let mainWindow: BrowserWindow | null = null;
let backendServer: Server | null = null;
let backendPort: number = 0;
let isOnline: boolean = true;

// Check online status
const checkOnlineStatus = (): boolean => {
  return net.isOnline();
};

// Load environment variables for packaged app
function loadEnv() {
  try {
    const dotenv = require('dotenv');
    if (isPackaged) {
      // In packaged app, .env is in extraResources
      const envPath = path.join(process.resourcesPath!, '.env');
      dotenv.config({ path: envPath });
      console.log(`[Electron] Loaded .env from: ${envPath}`);
    }
    // In dev, dotenv is loaded by the backend server.ts itself
  } catch (e) {
    console.warn('[Electron] Could not load dotenv:', e);
  }
}

// Start Express backend server
async function startBackend(): Promise<number> {
  try {
    // Set the frontend dist path as env var so backend can find it
    process.env.FRONTEND_DIST_PATH = getFrontendDistPath();

    // Import backend server using file:// URL for ESM compatibility
    const backendPath = getBackendPath();
    const backendUrl = pathToFileURL(backendPath).href;
    console.log(`[Electron] Loading backend from: ${backendPath}`);

    const { default: createApp } = await import(backendUrl) as { default: () => Express };

    const expressApp = createApp();

    // Use port 0 to get a random available port
    return new Promise((resolve, reject) => {
      const server = expressApp.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          const port = address.port;
          console.log(`[Electron] Backend server started on port ${port}`);
          backendServer = server;
          resolve(port);
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      server.on('error', (error: Error) => {
        console.error('[Electron] Backend server error:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('[Electron] Failed to start backend:', error);
    throw error;
  }
}

// Create main window
function createWindow(port: number) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: getIconPath(),
    title: 'Acueducto Rural - UPB',
    backgroundColor: '#f8fafc',
    show: false, // Don't show until ready
  });

  // Load the app from the backend server
  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Monitor online status
  setInterval(() => {
    const currentStatus = checkOnlineStatus();
    if (currentStatus !== isOnline) {
      isOnline = currentStatus;
      mainWindow?.webContents.send('online-status-changed', isOnline);
      console.log(`🌐 Network status changed: ${isOnline ? 'Online' : 'Offline'}`);
    }
  }, 5000); // Check every 5 seconds
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    console.log('[Electron] Starting Acueducto Rural UPB...');
    console.log(`[Electron] Packaged: ${isPackaged}`);
    console.log(`[Electron] App path: ${app.getAppPath()}`);

    // Load .env for packaged app
    loadEnv();

    // Start backend server
    backendPort = await startBackend();
    
    // Create window
    createWindow(backendPort);
    
    // Initial online status
    isOnline = checkOnlineStatus();
    console.log(`🌐 Initial network status: ${isOnline ? 'Online' : 'Offline'}`);
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(backendPort);
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup before quit
app.on('before-quit', () => {
  console.log('🛑 Shutting down...');
  
  // Stop backend server
  if (backendServer) {
    backendServer.close(() => {
      console.log('✅ Backend server stopped');
    });
  }
});

// IPC Handlers
ipcMain.handle('get-online-status', () => {
  return checkOnlineStatus();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', (event, name: string) => {
  return app.getPath(name as any);
});
