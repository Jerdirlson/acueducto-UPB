# Acueducto Rural - Gestión Comunitaria

Sistema de gestión para acueductos rurales desarrollado para la Universidad Pontificia Bolivariana (UPB).

## 🏗️ Arquitectura

El proyecto utiliza **Arquitectura en Capas (Layered Architecture)** con separación clara entre frontend y backend:

### Frontend (HTML + CSS + TypeScript Nativo)
- **Capa de Presentación**: HTML5 + CSS3 (Tailwind) + TypeScript puro
- **Capa de Servicios**: Lógica de negocio (PropertyService, PaymentService, etc.)
- **Capa de Datos**: PouchDB sobre IndexedDB para almacenamiento local
- **Módulos Funcionales**: predios.ts, pagos.ts, incidencias.ts, reportes.ts, respaldo.ts
- **Navegación**: Sistema hash-based (#predios, #pagos, etc.)

### Backend
- **Capa de Controladores**: Manejo de requests HTTP
- **Capa de Servicios**: Lógica de negocio del servidor
- **Capa de Rutas**: Definición de endpoints API

## 🚀 Tecnologías

- **Frontend**: HTML5, CSS3 (Tailwind), TypeScript puro (sin frameworks)
- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: IndexedDB (local) + CouchDB (remoto, opcional)
- **PWA**: Service Worker + Manifest para funcionamiento offline

## 📁 Estructura del Proyecto

```
/acueducto-app
  /frontend
    index.html              # HTML principal
    manifest.webmanifest    # PWA manifest
    /src
      main.ts              # Punto de entrada
      ui.ts                # Lógica de vistas / navegación
      predios.ts           # Módulo de predios
      pagos.ts             # Módulo de pagos
      incidencias.ts       # Módulo de incidencias
      reportes.ts          # Módulo de reportes
      respaldo.ts          # Módulo de exportación
      db.ts                # Configuración PouchDB (local + sync)
      /services            # Servicios de negocio
    /public
      sw.js                # Service Worker
    package.json
    vite.config.ts
    
  /backend
    /src
      /controllers         # Controladores (MVC)
      /services            # Servicios de negocio
      /routes              # Definición de rutas
      server.ts            # Servidor Express
    package.json
    tsconfig.json
    
  iniciar_sistema.bat      # Script de inicio (Windows)
  iniciar_sistema.ps1      # Script de inicio (PowerShell)
```

## 🛠️ Instalación

1. **Instalar dependencias del frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
```

2. **Instalar dependencias del backend:**
```bash
cd backend
npm install
```

## ▶️ Ejecución

### Opción 1: Script automático (Windows)
- **CMD**: Doble clic en `iniciar_sistema.bat`
- **PowerShell**: Ejecutar `.\iniciar_sistema.ps1`

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

El sistema estará disponible en:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

## 📦 Build para Producción

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm run build
npm start
```

## 🔐 Credenciales de Prueba

- Usuario: `admin`
- Contraseña: `123456`

## 📋 Funcionalidades

- ✅ Gestión de Predios
- ✅ Registro de Pagos
- ✅ Reporte de Incidencias
- ✅ Reportes y Estadísticas
- ✅ Respaldo y Restauración de Datos
- ✅ Funcionamiento Offline (PWA)
- ✅ Sincronización con CouchDB (opcional)

## 🔄 Sincronización con CouchDB

Para configurar la sincronización con CouchDB remoto:

1. Configurar la variable de entorno en el backend:
```bash
COUCHDB_URL=https://tu-servidor-couchdb/acueducto
```

2. El frontend se sincronizará automáticamente al iniciar.

## 📝 Notas Técnicas

- **Frontend Nativo**: No utiliza React ni otros frameworks, solo HTML + CSS + TypeScript puro
- Los datos se almacenan localmente en IndexedDB mediante PouchDB
- La aplicación funciona completamente offline
- La sincronización con CouchDB es opcional y se configura desde el backend
- Navegación mediante hash (#predios, #pagos, #incidencias, etc.)

## 🎨 Diseño

El diseño visual se mantiene idéntico al original, utilizando:
- Tailwind CSS para estilos
- Mismo esquema de colores UPB (#e3007b)
- Misma estructura de layout y componentes
- Responsive design para móvil y desktop
