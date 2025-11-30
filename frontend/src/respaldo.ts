// Capa de Presentación - Módulo de Respaldo
// Usa templates HTML separados para mantener la arquitectura en capas
import { Property, Payment, Incident } from '../types';
import { BackupService } from './services/backupService';
import { TemplateService } from './services/templateService';

export async function renderBackup(
  container: HTMLElement,
  data: { properties: Property[]; payments: Payment[]; incidents: Incident[] }
) {
  try {
    const template = await TemplateService.loadTemplate('templates/respaldo.html');

    const html = TemplateService.injectData(template, {
      propertiesCount: data.properties.length.toString(),
      paymentsCount: data.payments.length.toString(),
      incidentsCount: data.incidents.length.toString()
    });

    container.innerHTML = html;

    // Configurar event listeners
    async function handleExportCSV(type: 'properties' | 'payments' | 'incidents') {
      try {
        const content = await BackupService.exportToCSV(type);
        const filename = type === 'properties' ? 'predios.csv' : type === 'payments' ? 'pagos.csv' : 'incidencias.csv';
        
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting CSV:', error);
      }
    }

    async function handleFullBackup() {
      try {
        const backup = await BackupService.exportToJSON();
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `respaldo_acueducto_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating backup:', error);
      }
    }

    container.querySelector('#export-properties')?.addEventListener('click', () => handleExportCSV('properties'));
    container.querySelector('#export-payments')?.addEventListener('click', () => handleExportCSV('payments'));
    container.querySelector('#export-incidents')?.addEventListener('click', () => handleExportCSV('incidents'));
    container.querySelector('#full-backup-btn')?.addEventListener('click', handleFullBackup);
  } catch (error) {
    console.error('Error rendering backup:', error);
    container.innerHTML = '<div class="p-4 text-red-600">Error al cargar la página de respaldo</div>';
  }
}
