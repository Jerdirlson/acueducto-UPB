// Capa de Presentación - Módulo de Incidencias
// Usa templates HTML separados para mantener la arquitectura en capas
import { Incident, IncidentStatus } from '../types';
import { TemplateService } from './services/templateService';

export async function renderIncidents(
  container: HTMLElement,
  incidents: Incident[],
  onAddIncident: (i: Incident) => void,
  onUpdateIncident: (i: Incident) => void
) {
  let isAdding = false;
  let description = '';

  function getStatusClass(status: IncidentStatus): string {
    switch (status) {
      case IncidentStatus.OPEN: return 'bg-red-100 text-red-800 border-red-200';
      case IncidentStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  }

  async function renderForm() {
    try {
      const template = await TemplateService.loadTemplate('templates/incidencias-form.html');
      container.innerHTML = template;

      const form = container.querySelector('#incident-form') as HTMLFormElement;
      const cancelBtn = container.querySelector('#cancel-incident-btn');

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        description = (container.querySelector('#description') as HTMLTextAreaElement)?.value || '';
        
        if (!description) return;

        onAddIncident({
          id: crypto.randomUUID(),
          description,
          dateReported: new Date().toISOString().split('T')[0],
          status: IncidentStatus.OPEN
        });

        description = '';
        isAdding = false;
        renderList();
      });

      cancelBtn?.addEventListener('click', () => {
        isAdding = false;
        renderList();
      });
    } catch (error) {
      console.error('Error rendering incident form:', error);
      container.innerHTML = '<div class="p-4 text-red-600">Error al cargar el formulario</div>';
    }
  }

  function handleResolve(inc: Incident) {
    onUpdateIncident({
      ...inc,
      status: IncidentStatus.RESOLVED,
      dateResolved: new Date().toISOString().split('T')[0]
    });
  }

  async function renderList() {
    try {
      const listTemplate = await TemplateService.loadTemplate('templates/incidencias-list.html');
      const itemTemplate = await TemplateService.loadTemplate('templates/incidencias-item.html');

      container.innerHTML = listTemplate;

      const listContainer = container.querySelector('#incidents-list');
      if (!listContainer) return;

      if (incidents.length === 0) {
        const emptyTemplate = await TemplateService.loadTemplate('templates/empty-state.html');
        listContainer.innerHTML = TemplateService.injectData(emptyTemplate, {
          message: 'No hay incidencias reportadas. ¡Todo funciona bien!'
        });
      } else {
        const itemsHtml = incidents.map(inc => {
          const resolvedInfo = inc.dateResolved ? `
            <p class="text-sm text-green-700 mt-2 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Resuelto el: ${inc.dateResolved}
            </p>
          ` : '';

          const resolveButton = inc.status !== IncidentStatus.RESOLVED ? `
            <button data-incident-id="${inc.id}" class="resolve-btn shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded font-medium border-2 border-slate-300 text-slate-700 hover:bg-slate-50">
              Resolver
            </button>
          ` : '';

          return TemplateService.injectData(itemTemplate, {
            status: inc.status,
            statusClass: getStatusClass(inc.status as IncidentStatus),
            dateReported: inc.dateReported,
            description: inc.description,
            resolvedInfo,
            resolveButton
          });
        }).join('');

        listContainer.innerHTML = itemsHtml;
      }

      const newBtn = container.querySelector('#new-incident-btn');
      newBtn?.addEventListener('click', () => {
        isAdding = true;
        renderForm();
      });

      container.querySelectorAll('.resolve-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const incId = (btn as HTMLElement).dataset.incidentId;
          const inc = incidents.find(i => i.id === incId);
          if (inc) handleResolve(inc);
        });
      });
    } catch (error) {
      console.error('Error rendering incidents list:', error);
      container.innerHTML = '<div class="p-4 text-red-600">Error al cargar la lista de incidencias</div>';
    }
  }

  if (isAdding) {
    await renderForm();
  } else {
    await renderList();
  }
}
