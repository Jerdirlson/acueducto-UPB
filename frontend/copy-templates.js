// Script para copiar templates a public antes del build
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcTemplates = join(__dirname, 'src', 'templates');
const destTemplates = join(__dirname, 'public', 'src', 'templates');

console.log('📁 Copiando templates...');
console.log('De:', srcTemplates);
console.log('A:', destTemplates);

// Crear directorio destino
mkdirSync(destTemplates, { recursive: true });

// Copiar archivos
const files = readdirSync(srcTemplates);
files.forEach(file => {
  const src = join(srcTemplates, file);
  const dest = join(destTemplates, file);
  copyFileSync(src, dest);
  console.log('✅', file);
});

console.log('✅ Templates copiados correctamente');
