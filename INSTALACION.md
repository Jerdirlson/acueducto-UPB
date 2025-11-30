# Guía de Instalación - Acueducto Rural

## 📋 Requisitos Previos

Para ejecutar este proyecto necesitas tener **Node.js** instalado en tu sistema.

## 🔧 Instalación de Node.js

### Opción 1: Instalador Oficial (Recomendado)

1. **Descargar Node.js:**
   - Visita: https://nodejs.org/
   - Descarga la versión **LTS (Long Term Support)** - recomendada para la mayoría de usuarios
   - Ejemplo: Node.js v20.x LTS

2. **Instalar:**
   - Ejecuta el instalador descargado
   - Sigue el asistente de instalación
   - **IMPORTANTE:** Asegúrate de marcar la opción "Add to PATH" durante la instalación

3. **Verificar instalación:**
   - Abre una nueva ventana de PowerShell o CMD
   - Ejecuta:
   ```powershell
   node --version
   npm --version
   ```
   - Deberías ver las versiones instaladas

### Opción 2: Usando Chocolatey (Si ya lo tienes instalado)

```powershell
choco install nodejs-lts
```

### Opción 3: Usando winget (Windows Package Manager)

```powershell
winget install OpenJS.NodeJS.LTS
```

## ✅ Verificación Post-Instalación

Después de instalar Node.js:

1. **Cierra y vuelve a abrir** PowerShell/CMD (importante para cargar el nuevo PATH)

2. Verifica que Node.js esté instalado:
   ```powershell
   node --version
   npm --version
   ```

3. Si aún no funciona, verifica el PATH:
   ```powershell
   $env:PATH -split ';' | Select-String -Pattern "node"
   ```
   
   Deberías ver algo como: `C:\Program Files\nodejs\`

## 🚀 Instalación del Proyecto

Una vez que Node.js esté instalado:

### 1. Instalar dependencias del Frontend

```powershell
cd frontend
npm install
```

### 2. Instalar dependencias del Backend

```powershell
cd ..\backend
npm install
```

### 3. Ejecutar el Sistema

**Opción A: Script automático**
- Doble clic en `iniciar_sistema.bat`

**Opción B: Manual**

Terminal 1 (Backend):
```powershell
cd backend
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

## 🔍 Solución de Problemas

### Error: "npm no se reconoce"

**Causa:** Node.js no está en el PATH del sistema.

**Solución:**
1. Verifica que Node.js esté instalado en: `C:\Program Files\nodejs\`
2. Agrega manualmente al PATH:
   - Presiona `Win + R`
   - Escribe: `sysdm.cpl` y presiona Enter
   - Ve a la pestaña "Opciones avanzadas"
   - Click en "Variables de entorno"
   - En "Variables del sistema", busca "Path" y edítalo
   - Agrega: `C:\Program Files\nodejs\`
   - Acepta todos los diálogos
   - **Reinicia PowerShell/CMD**

### Error: "Cannot find module"

**Causa:** Las dependencias no están instaladas.

**Solución:**
```powershell
cd frontend
npm install
cd ..\backend
npm install
```

### Error: Puerto en uso

**Causa:** El puerto 3000 o 5173 ya está en uso.

**Solución:**
- Cierra otras aplicaciones que usen esos puertos
- O cambia los puertos en `vite.config.ts` y `backend/src/server.ts`

## 📞 Soporte

Si tienes problemas:
1. Verifica que Node.js esté correctamente instalado
2. Asegúrate de haber cerrado y reabierto PowerShell después de instalar Node.js
3. Verifica que todas las dependencias estén instaladas (`npm install` en ambas carpetas)

