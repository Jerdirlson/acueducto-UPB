// Punto de entrada del frontend - Registro de Service Worker y inicialización
import './styles.css';
import { initApp } from './ui';

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado:', registration.scope);
      })
      .catch((error) => {
        console.log('Error al registrar Service Worker:', error);
      });
  });
}

// Inicializar aplicación
async function initialize() {
  console.log('🚀 Iniciando aplicación...');
  try {
    // Inicializar UI
    await initApp();
  } catch (error) {
    console.error('❌ Error inicializando aplicación:', error);
  }
}

// Esperar a que el DOM esté listo
function waitForDOM() {
  const contentArea = document.getElementById('content-area');
  const appLayout = document.getElementById('app-layout');
  
  if (!contentArea || !appLayout) {
    console.log('⏳ Esperando elementos del DOM...');
    setTimeout(waitForDOM, 100);
    return;
  }
  
  console.log('✅ Elementos del DOM listos');
  initialize();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForDOM);
} else {
  waitForDOM();
}
