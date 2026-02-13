/**
 * Script para generar iconos PNG a partir del SVG
 * Ejecutar: npm run generate-icons
 * Requiere: npm install sharp --save-dev
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICONS_DIR = join(__dirname, '../public/icons');
const SVG_PATH = join(ICONS_DIR, 'icon.svg');

const SIZES = [192, 512];

async function generateIcons() {
  console.log('Generando iconos PWA...');

  // Asegurar que el directorio existe
  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }

  const svgBuffer = readFileSync(SVG_PATH);

  for (const size of SIZES) {
    const outputPath = join(ICONS_DIR, `icon-${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`  Generado: icon-${size}.png`);
  }

  console.log('Iconos generados exitosamente.');
}

generateIcons().catch(console.error);
