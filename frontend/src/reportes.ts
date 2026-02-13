// Capa de Presentación - Módulo de Reportes
// Usa templates HTML separados para mantener la arquitectura en capas
import { Property, Payment, Incident } from '../types';
import { TemplateService } from './services/templateService';
import { ReportService } from './services/reportService';
import { PdfService } from './services/pdfService';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export async function renderReports(
  container: HTMLElement,
  properties: Property[],
  payments: Payment[],
  incidents: Incident[]
) {
  try {
    const template = await TemplateService.loadTemplate('templates/reportes.html');
    const reportData = ReportService.calculateReportData(properties, payments, incidents);

    // Get current semester
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;
    const currentSemester = `${year}-${semester}`;

    const html = TemplateService.injectData(template, {
      totalProperties: reportData.kpis.totalProperties.toString(),
      activeProperties: reportData.kpis.activeProperties.toString(),
      currentSemester,
      currentSemesterRevenue: reportData.kpis.currentSemesterRevenue.toLocaleString(),
      paymentRate: reportData.kpis.paymentRate.toString(),
      latePayments: reportData.kpis.latePayments.toString(),
      openIncidents: reportData.kpis.openIncidents.toString()
    });

    container.innerHTML = html;

    // Wait for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Render Bar Chart - Payments by Semester
    const paymentsCtx = container.querySelector('#payments-chart') as HTMLCanvasElement;
    if (paymentsCtx) {
      const paymentsChart = new Chart(paymentsCtx, {
        type: 'bar',
        data: {
          labels: reportData.paymentsBySemester.map(p => p.semester),
          datasets: [
            {
              label: 'Total Recaudado',
              data: reportData.paymentsBySemester.map(p => p.total),
              backgroundColor: '#e3007b',
              borderColor: '#e3007b',
              borderWidth: 1
            },
            {
              label: 'Pagado',
              data: reportData.paymentsBySemester.map(p => p.paid),
              backgroundColor: '#16a34a',
              borderColor: '#16a34a',
              borderWidth: 1
            },
            {
              label: 'Pendiente',
              data: reportData.paymentsBySemester.map(p => p.pending),
              backgroundColor: '#fbbf24',
              borderColor: '#fbbf24',
              borderWidth: 1
            },
            {
              label: 'En Mora',
              data: reportData.paymentsBySemester.map(p => p.late),
              backgroundColor: '#dc2626',
              borderColor: '#dc2626',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `$${Number(value).toLocaleString()}`
              }
            }
          }
        }
      });
    }

    // Render Pie Chart - Properties by Status
    const propertiesCtx = container.querySelector('#properties-chart') as HTMLCanvasElement;
    if (propertiesCtx) {
      const propertiesChart = new Chart(propertiesCtx, {
        type: 'doughnut',
        data: {
          labels: ['Activos', 'Suspendidos', 'Inactivos'],
          datasets: [
            {
              data: [
                reportData.propertiesByStatus.active,
                reportData.propertiesByStatus.suspended,
                reportData.propertiesByStatus.inactive
              ],
              backgroundColor: ['#16a34a', '#fbbf24', '#dc2626'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = total > 0 ? ((context.parsed as number) / total * 100).toFixed(1) : 0;
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    // Render Line Chart - Incidents by Month
    const incidentsCtx = container.querySelector('#incidents-chart') as HTMLCanvasElement;
    if (incidentsCtx) {
      const incidentsChart = new Chart(incidentsCtx, {
        type: 'line',
        data: {
          labels: reportData.incidentsByMonth.map(i => {
            const [year, month] = i.month.split('-');
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          }),
          datasets: [
            {
              label: 'Reportadas',
              data: reportData.incidentsByMonth.map(i => i.reported),
              borderColor: '#e3007b',
              backgroundColor: 'rgba(227, 0, 123, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Resueltas',
              data: reportData.incidentsByMonth.map(i => i.resolved),
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }

    // Export PDF button
    const exportPdfBtn = container.querySelector('#export-pdf-btn');
    exportPdfBtn?.addEventListener('click', () => {
      PdfService.generateDashboardPDF(properties, payments, incidents);
    });
  } catch (error) {
    console.error('Error rendering reports:', error);
    container.innerHTML = '<div class="p-4 text-red-600">Error al cargar los reportes</div>';
  }
}
