// Capa de Presentación - Módulo de Incidencias
// Usa templates HTML separados para mantener la arquitectura en capas
import { Incident, IncidentStatus } from '../types';
import { TemplateService } from './services/templateService';
import { PdfService } from './services/pdfService';

export async function renderIncidents(
  container: HTMLElement,
  incidents: Incident[],
  onAddIncident: (i: Incident) => void,
  onUpdateIncident: (i: Incident) => void
) {
  let isAdding = false;
  let description = '';
  let searchQuery = '';
  let statusFilter: string | null = null;
  let dateFromFilter = '';
  let dateToFilter = '';
  let debounceTimer: number | null = null;
  
  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 20;
  let totalItems = 0;

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

  function filterIncidents(items: Incident[]): Incident[] {
    let filtered = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inc =>
        inc.description.toLowerCase().includes(query) ||
        (inc.notes && inc.notes.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(inc => inc.status === statusFilter);
    }

    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(inc => inc.dateReported >= dateFromFilter);
    }
    if (dateToFilter) {
      filtered = filtered.filter(inc => inc.dateReported <= dateToFilter);
    }

    return filtered;
  }

  function updateFilterChips() {
    const chipsContainer = container.querySelector('#filter-chips');
    const clearBtn = container.querySelector('#clear-filters-btn');
    if (!chipsContainer) return;

    const activeFilters: string[] = [];
    if (searchQuery.trim()) {
      activeFilters.push(`Búsqueda: "${searchQuery}"`);
    }
    if (statusFilter && statusFilter !== 'all') {
      activeFilters.push(`Estado: ${statusFilter}`);
    }
    if (dateFromFilter || dateToFilter) {
      const dateRange = dateFromFilter && dateToFilter
        ? `${dateFromFilter} - ${dateToFilter}`
        : dateFromFilter || dateToFilter;
      activeFilters.push(`Fechas: ${dateRange}`);
    }

    if (activeFilters.length > 0) {
      chipsContainer.innerHTML = activeFilters.map(filter => `
        <span class="inline-flex items-center gap-1 px-3 py-1 bg-upb-red/10 text-upb-red rounded-full text-sm font-medium">
          ${filter}
        </span>
      `).join('');
      if (clearBtn) {
        clearBtn.classList.remove('hidden');
      }
    } else {
      chipsContainer.innerHTML = '';
      if (clearBtn) {
        clearBtn.classList.add('hidden');
      }
    }
  }

  async function renderList() {
    try {
      const listTemplate = await TemplateService.loadTemplate('templates/incidencias-list.html');
      const itemTemplate = await TemplateService.loadTemplate('templates/incidencias-item.html');
      const searchBarTemplate = await TemplateService.loadTemplate('templates/search-bar.html');

      container.innerHTML = listTemplate;

      // Inject search bar
      const searchSection = container.querySelector('#search-filters-section');
      if (searchSection) {
        searchSection.innerHTML = searchBarTemplate;
      }

      const listContainer = container.querySelector('#incidents-list');
      if (!listContainer) return;

      // Filter incidents
      const filteredIncidents = filterIncidents(incidents);
      totalItems = filteredIncidents.length;
      
      // Calculate pagination
      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      
      const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, totalItems);
      const paginatedIncidents = filteredIncidents.slice(start - 1, end);

      if (paginatedIncidents.length === 0) {
        const emptyTemplate = await TemplateService.loadTemplate('templates/empty-state.html');
        const message = incidents.length === 0
          ? 'No hay incidencias reportadas. ¡Todo funciona bien!'
          : 'No se encontraron incidencias con los filtros aplicados.';
        listContainer.innerHTML = TemplateService.injectData(emptyTemplate, { message });
      } else {
        const itemsHtml = paginatedIncidents.map(inc => {
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

      // Render pagination
      if (totalItems > itemsPerPage) {
        const paginationTemplate = await TemplateService.loadTemplate('templates/pagination.html');
        const paginationHtml = TemplateService.injectData(paginationTemplate, {
          start: start.toString(),
          end: end.toString(),
          total: totalItems.toString(),
          currentPage: currentPage.toString(),
          totalPages: totalPages.toString(),
          prevDisabled: currentPage === 1 ? 'disabled' : '',
          nextDisabled: currentPage === totalPages ? 'disabled' : ''
        });
        
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination-container';
        paginationContainer.innerHTML = paginationHtml;
        listContainer.parentElement?.appendChild(paginationContainer);

        // Setup pagination controls
        const prevBtn = container.querySelector('#pagination-prev');
        const nextBtn = container.querySelector('#pagination-next');
        const pageInput = container.querySelector('#pagination-page-input') as HTMLInputElement;

        prevBtn?.addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            renderList();
          }
        });

        nextBtn?.addEventListener('click', () => {
          if (currentPage < totalPages) {
            currentPage++;
            renderList();
          }
        });

        pageInput?.addEventListener('change', (e) => {
          const page = parseInt((e.target as HTMLInputElement).value);
          if (page >= 1 && page <= totalPages) {
            currentPage = page;
            renderList();
          } else {
            (e.target as HTMLInputElement).value = currentPage.toString();
          }
        });
      } else {
        const existingPagination = container.querySelector('#pagination-container');
        existingPagination?.remove();
      }

      // Update filter chips
      updateFilterChips();

      // Setup search input with debounce
      const searchInput = container.querySelector('#search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = searchQuery;
        searchInput.addEventListener('input', (e) => {
          const value = (e.target as HTMLInputElement).value;
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          debounceTimer = window.setTimeout(() => {
            searchQuery = value;
            currentPage = 1; // Reset to first page when search changes
            renderList();
          }, 300);
        });
      }

      // Setup clear filters button
      const clearBtn = container.querySelector('#clear-filters-btn');
      clearBtn?.addEventListener('click', () => {
        searchQuery = '';
        statusFilter = null;
        dateFromFilter = '';
        dateToFilter = '';
        currentPage = 1; // Reset to first page
        const searchInput = container.querySelector('#search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        const statusSelect = container.querySelector('#incident-status-filter') as HTMLSelectElement;
        if (statusSelect) statusSelect.value = 'all';
        const dateFrom = container.querySelector('#incident-date-from-filter') as HTMLInputElement;
        if (dateFrom) dateFrom.value = '';
        const dateTo = container.querySelector('#incident-date-to-filter') as HTMLInputElement;
        if (dateTo) dateTo.value = '';
        renderList();
      });

      // Setup filters
      const newBtn = container.querySelector('#new-incident-btn');
      const statusSelect = container.querySelector('#incident-status-filter') as HTMLSelectElement;
      const dateFromInput = container.querySelector('#incident-date-from-filter') as HTMLInputElement;
      const dateToInput = container.querySelector('#incident-date-to-filter') as HTMLInputElement;

      newBtn?.addEventListener('click', () => {
        isAdding = true;
        renderForm();
      });

      // Export PDF button
      const exportPdfBtn = container.querySelector('#export-pdf-btn');
      exportPdfBtn?.addEventListener('click', () => {
        const filtered = filterIncidents(incidents);
        const filters: string[] = [];
        if (searchQuery.trim()) filters.push(`Búsqueda: "${searchQuery}"`);
        if (statusFilter && statusFilter !== 'all') filters.push(`Estado: ${statusFilter}`);
        if (dateFromFilter || dateToFilter) {
          const dateRange = dateFromFilter && dateToFilter
            ? `${dateFromFilter} - ${dateToFilter}`
            : dateFromFilter || dateToFilter;
          filters.push(`Fechas: ${dateRange}`);
        }
        PdfService.generateIncidentsPDF(filtered, filters.length > 0 ? filters.join(', ') : undefined);
      });

      if (statusSelect) {
        statusSelect.value = statusFilter || 'all';
        statusSelect.addEventListener('change', (e) => {
          statusFilter = (e.target as HTMLSelectElement).value;
          currentPage = 1;
          renderList();
        });
      }

      if (dateFromInput) {
        dateFromInput.value = dateFromFilter;
        dateFromInput.addEventListener('change', (e) => {
          dateFromFilter = (e.target as HTMLInputElement).value;
          currentPage = 1;
          renderList();
        });
      }

      if (dateToInput) {
        dateToInput.value = dateToFilter;
        dateToInput.addEventListener('change', (e) => {
          dateToFilter = (e.target as HTMLInputElement).value;
          currentPage = 1;
          renderList();
        });
      }

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
