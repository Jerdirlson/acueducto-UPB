// Lógica de vistas / navegación
import { ViewState } from '../types';
import { renderProperties } from './predios';
import { renderPayments } from './pagos';
import { renderIncidents } from './incidencias';
import { renderReports } from './reportes';
import { renderBackup } from './respaldo';
import { renderLogin } from './login';
import { TemplateService } from './services/templateService';
import { PropertyService } from './services/propertyService';
import { PaymentService } from './services/paymentService';
import { IncidentService } from './services/incidentService';
import { ServiceStatus } from '../types';

// Mock Data for initial seed
const MOCK_PROPERTIES = [
  { id: '1', number: '001', ownerName: 'Familia Rodriguez', status: ServiceStatus.ACTIVE },
  { id: '2', number: '002', ownerName: 'Carlos Pérez', status: ServiceStatus.SUSPENDED },
  { id: '3', number: '003', ownerName: 'Maria González', status: ServiceStatus.ACTIVE },
];

let currentView: ViewState = 'PROPERTIES';
let isAuthenticated = false;
let isMenuOpen = false;

// Estado de la aplicación
let properties: any[] = [];
let payments: any[] = [];
let incidents: any[] = [];

export async function initApp() {
  console.log('🔵 Inicializando aplicación...');
  
  // Verificar que los elementos del DOM existan
  const contentArea = document.getElementById('content-area');
  const appLayout = document.getElementById('app-layout');
  
  if (!contentArea) {
    console.error('❌ Elemento content-area no encontrado en el DOM');
    return;
  }
  if (!appLayout) {
    console.error('❌ Elemento app-layout no encontrado en el DOM');
    return;
  }
  
  console.log('✅ Elementos del DOM verificados');
  
  // Check Auth
  const authStatus = localStorage.getItem('acueducto_auth');
  if (authStatus === 'true') {
    isAuthenticated = true;
    console.log('✅ Usuario autenticado');
  }

  if (!isAuthenticated) {
    console.log('🔒 Mostrando login');
    await showLogin();
    return;
  }

  // Load Data
  console.log('📦 Cargando datos...');
  await loadData();
  console.log('✅ Datos cargados:', { properties: properties.length, payments: payments.length, incidents: incidents.length });
  
  // Setup UI
  console.log('🎨 Configurando UI...');
  setupLayout();
  setupNavigation();
  setupEventListeners();
  
  // Render initial view - con un pequeño delay para asegurar que todo esté listo
  setTimeout(() => {
    const initialView = getViewFromHash() || 'PROPERTIES';
    console.log('📄 Renderizando vista inicial:', initialView);
    navigateToView(initialView);
    console.log('✅ Aplicación inicializada');
  }, 100);
}

async function loadData() {
  try {
    const [loadedProps, loadedPays, loadedIncs] = await Promise.all([
      PropertyService.getAll(),
      PaymentService.getAll(),
      IncidentService.getAll()
    ]);

    // Seed initial data if empty
    if (loadedProps.length === 0 && loadedPays.length === 0 && loadedIncs.length === 0) {
      for (const prop of MOCK_PROPERTIES) {
        await PropertyService.create(prop);
      }
      properties = MOCK_PROPERTIES;
    } else {
      properties = loadedProps;
      payments = loadedPays;
      incidents = loadedIncs;
    }
  } catch (e) {
    console.error("Failed to load data", e);
    properties = [];
    payments = [];
    incidents = [];
  }
}

function setupLayout() {
  const loginView = document.getElementById('login-view');
  const appLayout = document.getElementById('app-layout');
  
  if (loginView) loginView.classList.add('view-hidden');
  if (appLayout) appLayout.classList.remove('view-hidden');
}

function setupNavigation() {
  const navItems = document.getElementById('nav-items');
  if (!navItems) return;

  const navConfig = [
    { view: 'PROPERTIES', label: 'Predios', icon: 'home' },
    { view: 'PAYMENTS', label: 'Pagos', icon: 'banknote' },
    { view: 'INCIDENTS', label: 'Incidencias', icon: 'alert' },
    { view: 'REPORTS', label: 'Reportes', icon: 'chart' },
    { view: 'BACKUP', label: 'Respaldo', icon: 'save' },
  ];

  navItems.innerHTML = navConfig.map(item => {
    const isActive = currentView === item.view;
    return `
      <button
        data-view="${item.view}"
        class="nav-item w-full flex items-center gap-3 px-4 py-4 text-left transition-all border-l-4 ${
          isActive
            ? 'bg-zinc-800 text-white border-upb-red font-bold'
            : 'text-slate-400 hover:bg-zinc-800 hover:text-white border-transparent font-medium'
        }"
      >
        ${getIconSVG(item.icon, isActive)}
        <span>${item.label}</span>
      </button>
    `;
  }).join('');

  // Add click handlers
  navItems.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = (e.currentTarget as HTMLElement).dataset.view as ViewState;
      navigateToView(view);
      closeMobileMenu();
    });
  });
}

function getIconSVG(icon: string, active: boolean = false): string {
  const icons: Record<string, string> = {
    home: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${active ? '#e3007b' : 'currentColor'}" stroke-width="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
    banknote: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${active ? '#e3007b' : 'currentColor'}" stroke-width="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>`,
    alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${active ? '#e3007b' : 'currentColor'}" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    chart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${active ? '#e3007b' : 'currentColor'}" stroke-width="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`,
    save: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${active ? '#e3007b' : 'currentColor'}" stroke-width="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>`,
  };
  return icons[icon] || '';
}

function setupEventListeners() {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const sidebar = document.getElementById('sidebar');

  mobileMenuBtn?.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen;
    updateMobileMenu();
  });

  mobileOverlay?.addEventListener('click', () => {
    closeMobileMenu();
  });

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    handleLogout();
  });

  // Online/Offline status
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Hash navigation
  window.addEventListener('hashchange', async () => {
    const view = getViewFromHash();
    if (view) await navigateToView(view);
  });
}

function updateMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');
  
  if (sidebar) {
    sidebar.classList.toggle('-translate-x-full', !isMenuOpen);
  }
  if (overlay) {
    overlay.classList.toggle('view-hidden', !isMenuOpen);
  }
}

function closeMobileMenu() {
  isMenuOpen = false;
  updateMobileMenu();
}

function updateOnlineStatus() {
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  const isOnline = navigator.onLine;

  if (statusBar && statusText) {
    if (isOnline) {
      statusBar.className = 'p-4 text-center text-xs font-semibold bg-zinc-900 text-green-400';
      statusText.textContent = 'Conectado';
      statusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Conectado';
    } else {
      statusBar.className = 'p-4 text-center text-xs font-semibold bg-amber-900 text-amber-200';
      statusText.textContent = 'Modo Offline';
      statusText.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span> Modo Offline';
    }
  }
}

function getViewFromHash(): ViewState | null {
  const hash = window.location.hash.slice(1).toUpperCase();
  const validViews: ViewState[] = ['PROPERTIES', 'PAYMENTS', 'INCIDENTS', 'REPORTS', 'BACKUP'];
  return validViews.includes(hash as ViewState) ? (hash as ViewState) : null;
}

export function navigateToView(view: ViewState) {
  console.log('🔄 Navegando a vista:', view);
  currentView = view;
  window.location.hash = view.toLowerCase();
  
  // Update navigation
  setupNavigation();
  
  // Render view - esperar a que el DOM esté listo
  setTimeout(async () => {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
      console.error('❌ No se encontró el elemento content-area');
      // Intentar de nuevo después de un momento
      setTimeout(() => navigateToView(view), 100);
      return;
    }

    console.log('📝 Renderizando contenido para:', view, 'en elemento:', contentArea);
    console.log('📊 Datos disponibles:', { 
      properties: properties.length, 
      payments: payments.length, 
      incidents: incidents.length 
    });
    
    try {
      // Limpiar contenido anterior
      contentArea.innerHTML = '<div class="text-center p-4 text-slate-500">Cargando...</div>';
      
      switch (view) {
        case 'PROPERTIES':
          console.log('🏠 Renderizando predios, cantidad:', properties.length);
          await renderProperties(contentArea, properties, handleAddProperty, handleUpdateProperty);
          break;
        case 'PAYMENTS':
          console.log('💰 Renderizando pagos, cantidad:', payments.length);
          await renderPayments(contentArea, payments, properties, handleAddPayment);
          break;
        case 'INCIDENTS':
          console.log('⚠️ Renderizando incidencias, cantidad:', incidents.length);
          await renderIncidents(contentArea, incidents, handleAddIncident, handleUpdateIncident);
          break;
        case 'REPORTS':
          console.log('📊 Renderizando reportes');
          await renderReports(contentArea, properties, payments, incidents);
          break;
        case 'BACKUP':
          console.log('💾 Renderizando respaldo');
          await renderBackup(contentArea, { properties, payments, incidents });
          break;
      }
      
      // Verificar que el contenido se haya renderizado
      setTimeout(() => {
        if (contentArea.innerHTML.trim() === '' || contentArea.innerHTML.includes('Cargando...')) {
          console.error('❌ El contenido no se renderizó correctamente');
        } else {
          console.log('✅ Vista renderizada correctamente. Contenido:', contentArea.innerHTML.substring(0, 100));
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error al renderizar vista:', error);
      try {
        const errorTemplate = await TemplateService.loadTemplate('templates/error-message.html');
        contentArea.innerHTML = TemplateService.injectData(errorTemplate, {
          title: 'Error al cargar la vista',
          message: error instanceof Error ? error.message : String(error)
        });
      } catch (e) {
        contentArea.innerHTML = '<div class="p-4 text-red-600">Error al cargar la vista</div>';
      }
    }
  }, 50);
}

// Data handlers
async function handleAddProperty(p: any) {
  try {
    const saved = await PropertyService.create(p);
    properties.push(saved);
    await refreshData();
    if (currentView === 'PROPERTIES') {
      navigateToView('PROPERTIES');
    }
  } catch (e) {
    console.error('Error adding property:', e);
  }
}

async function handleUpdateProperty(p: any) {
  try {
    const saved = await PropertyService.update(p);
    properties = properties.map(item => item.id === p.id ? saved : item);
    await refreshData();
    if (currentView === 'PROPERTIES') {
      navigateToView('PROPERTIES');
    }
  } catch (e) {
    console.error('Error updating property:', e);
  }
}

async function handleAddPayment(p: any) {
  try {
    const saved = await PaymentService.create(p);
    payments.unshift(saved);
    await refreshData();
    if (currentView === 'PAYMENTS') {
      navigateToView('PAYMENTS');
    }
  } catch (e) {
    console.error('Error adding payment:', e);
  }
}

async function handleAddIncident(i: any) {
  try {
    const saved = await IncidentService.create(i);
    incidents.unshift(saved);
    await refreshData();
    if (currentView === 'INCIDENTS') {
      navigateToView('INCIDENTS');
    }
  } catch (e) {
    console.error('Error adding incident:', e);
  }
}

async function handleUpdateIncident(i: any) {
  try {
    const saved = await IncidentService.update(i);
    incidents = incidents.map(item => item.id === i.id ? saved : item);
    await refreshData();
    if (currentView === 'INCIDENTS') {
      navigateToView('INCIDENTS');
    }
  } catch (e) {
    console.error('Error updating incident:', e);
  }
}

async function refreshData() {
  const [props, pays, incs] = await Promise.all([
    PropertyService.getAll(),
    PaymentService.getAll(),
    IncidentService.getAll()
  ]);
  properties = props;
  payments = pays;
  incidents = incs;
}

function handleLogout() {
  localStorage.removeItem('acueducto_auth');
  isAuthenticated = false;
  showLogin();
}

async function showLogin() {
  const loginView = document.getElementById('login-view');
  const appLayout = document.getElementById('app-layout');
  
  if (loginView) {
    loginView.classList.remove('view-hidden');
    await renderLogin(loginView, () => {
      localStorage.setItem('acueducto_auth', 'true');
      isAuthenticated = true;
      initApp();
    });
  }
  if (appLayout) appLayout.classList.add('view-hidden');
}

// Export data getters for views
export function getProperties() { return properties; }
export function getPayments() { return payments; }
export function getIncidents() { return incidents; }

