// Capa de Presentación - Módulo de Reportes
// Usa templates HTML separados para mantener la arquitectura en capas
import { Property, Payment, Incident, IncidentStatus, PaymentStatus } from '../types';
import { TemplateService } from './services/templateService';

export async function renderReports(
  container: HTMLElement,
  properties: Property[],
  payments: Payment[],
  incidents: Incident[]
) {
  try {
    const template = await TemplateService.loadTemplate('templates/reportes.html');

    const totalProperties = properties.length;
    const openIncidents = incidents.filter(i => i.status === IncidentStatus.OPEN).length;
    const currentSemester = '2024-1';
    const paymentsThisSemester = payments.filter(p => p.semester === currentSemester);
    const paidCount = paymentsThisSemester.filter(p => p.status === PaymentStatus.PAID).length;
    const lateCount = paymentsThisSemester.filter(p => p.status === PaymentStatus.LATE).length;
    const pendingCount = Math.max(0, totalProperties - (paidCount + lateCount));
    const totalCollected = paymentsThisSemester.reduce((sum, p) => sum + (p.status === PaymentStatus.PAID ? p.amount : 0), 0);

    const chartData = [
      { name: 'Pagado', value: paidCount, color: '#16a34a' },
      { name: 'Mora', value: lateCount, color: '#e3007b' },
      { name: 'Pendiente', value: pendingCount, color: '#fbbf24' },
    ];

    const maxValue = Math.max(...chartData.map(d => d.value), 1);

    const chartBars = chartData.map(item => {
      const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
      return `
        <div class="flex items-center gap-4">
          <div class="w-24 text-sm font-medium text-slate-700">${item.name}</div>
          <div class="flex-1 bg-slate-200 rounded-full h-8 relative overflow-hidden">
            <div class="h-full rounded-full transition-all" style="width: ${width}%; background-color: ${item.color};"></div>
            <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">${item.value}</span>
          </div>
        </div>
      `;
    }).join('');

    const html = TemplateService.injectData(template, {
      totalProperties: totalProperties.toString(),
      currentSemester,
      totalCollected: totalCollected.toLocaleString(),
      lateCount: lateCount.toString(),
      openIncidents: openIncidents.toString(),
      chartBars
    });

    container.innerHTML = html;
  } catch (error) {
    console.error('Error rendering reports:', error);
    container.innerHTML = '<div class="p-4 text-red-600">Error al cargar los reportes</div>';
  }
}
