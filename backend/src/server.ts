// Servidor Principal - Punto de Entrada del Backend
// IMPORTANTE: Cargar variables de entorno ANTES de cualquier otro import
import 'dotenv/config';

import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';
import apiRoutes from './routes/index.js';
import { couchdbService } from './services/couchdbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Server] Initializing server module...');

// Create and configure Express app
export function createApp(): Express {
  console.log('[Server] createApp() called');
  const app = express();

  // CORS: allow frontend dev server (localhost:5173) and same origin
  app.use(cors({ origin: true, credentials: true }));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', apiRoutes);

  // Start CouchDB health check polling
  couchdbService.startHealthCheck();

  // Servir archivos estáticos del frontend
  // In Electron packaged app, FRONTEND_DIST_PATH is set by the main process
  const frontendDist = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../../frontend/dist');

  // Check if frontend exists
  if (existsSync(frontendDist) && existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist));

    // Fallback: servir index.html para SPA
    app.get('*', (req, res) => {
      const indexPath = path.join(frontendDist, 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend not found');
      }
    });
  } else {
    // Show error page if frontend is not built
    app.get('*', (req, res) => {
      res.status(404).send(`
        <html>
          <head><title>Error - Frontend no compilado</title></head>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>❌ Error: Frontend no compilado</h1>
            <p>El directorio <code>frontend/dist</code> no existe o está vacío.</p>
            <p>Por favor ejecuta:</p>
            <pre style="background: #f0f0f0; padding: 20px; display: inline-block; border-radius: 5px;">
cd frontend
npm install
npm run build
            </pre>
          </body>
        </html>
      `);
    });
  }

  return app;
}

// Start server if running standalone (not imported by Electron)
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  console.log('[Server] Starting server as main module...');
  const app = createApp();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📁 Sirviendo frontend desde: ${path.join(__dirname, '../../frontend/dist')}`);
    console.log(`✅ Sistema listo para usar`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ ERROR: El puerto ${PORT} ya está en uso`);
      console.error('Cierra la aplicación que está usando el puerto 3000 o cambia el puerto en .env');
    } else {
      console.error('❌ ERROR al iniciar el servidor:', err.message);
    }
    process.exit(1);
  });
}

// Export for use by Electron or other integrations
export default createApp;

