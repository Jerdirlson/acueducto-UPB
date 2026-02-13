// Capa de Presentación - Módulo de Predios
// Usa templates HTML separados para mantener la arquitectura en capas
import { Property, ServiceStatus } from '../types';
import { TemplateService } from './services/templateService';
import { PdfService } from './services/pdfService';

export async function renderProperties(
  container: HTMLElement,
  properties: Property[],
  onAddProperty: (p: Property) => void,
  onUpdateProperty: (p: Property) => void
) {
  let isEditing = false;
  let editingId: string | null = null;
  let formData: Partial<Property> = {
    ownerName: '',
    number: '',
    status: ServiceStatus.ACTIVE,
    notes: ''
  };

  // Filter state
  let searchQuery = '';
  let statusFilter: string | null = null;
  let debounceTimer: number | null = null;
  
  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 20;
  let totalItems = 0;

  function getStatusColor(status: ServiceStatus): string {
    switch (status) {
      case ServiceStatus.ACTIVE: return 'green';
      case ServiceStatus.SUSPENDED: return 'yellow';
      case ServiceStatus.INACTIVE: return 'red';
      default: return 'gray';
    }
  }

  function getStatusClass(status: ServiceStatus): string {
    const color = getStatusColor(status);
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  async function renderForm() {
    try {
      const template = await TemplateService.loadTemplate('templates/predios-form.html');
      
      // Generar opciones de estado
      const statusOptions = [
        { value: ServiceStatus.ACTIVE, selected: formData.status === ServiceStatus.ACTIVE },
        { value: ServiceStatus.SUSPENDED, selected: formData.status === ServiceStatus.SUSPENDED },
        { value: ServiceStatus.INACTIVE, selected: formData.status === ServiceStatus.INACTIVE }
      ].map(opt => 
        `<option value="${opt.value}" ${opt.selected ? 'selected' : ''}>${opt.value}</option>`
      ).join('');

      const html = TemplateService.injectData(template, {
        title: editingId ? 'Editar Predio' : 'Nuevo Predio',
        number: formData.number || '',
        ownerName: formData.ownerName || '',
        statusOptions
      });

      container.innerHTML = html;

      // Configurar event listeners
      const form = container.querySelector('#property-form') as HTMLFormElement;
      const cancelBtn = container.querySelector('#cancel-btn');

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const number = (container.querySelector('#number') as HTMLInputElement)?.value;
        const ownerName = (container.querySelector('#owner') as HTMLInputElement)?.value;
        const status = (container.querySelector('#status') as HTMLSelectElement)?.value as ServiceStatus;

        if (!ownerName || !number) return;

        if (editingId) {
          onUpdateProperty({ ...formData, id: editingId, number, ownerName, status } as Property);
        } else {
          onAddProperty({
            id: crypto.randomUUID(),
            number,
            ownerName,
            status: status || ServiceStatus.ACTIVE,
            notes: formData.notes
          });
        }
        resetForm();
        renderList();
      });

      cancelBtn?.addEventListener('click', () => {
        resetForm();
        renderList();
      });
    } catch (error) {
      console.error('Error rendering form:', error);
      container.innerHTML = '<div class="p-4 text-red-600">Error al cargar el formulario</div>';
    }
  }

  function resetForm() {
    isEditing = false;
    editingId = null;
    formData = { ownerName: '', number: '', status: ServiceStatus.ACTIVE, notes: '' };
  }

  function handleEdit(prop: Property) {
    formData = { ...prop };
    editingId = prop.id;
    isEditing = true;
    renderForm();
  }

  function filterProperties(items: Property[]): Property[] {
    let filtered = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prop =>
        prop.ownerName.toLowerCase().includes(query) ||
        prop.number.toLowerCase().includes(query) ||
        (prop.notes && prop.notes.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(prop => prop.status === statusFilter);
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
      const listTemplate = await TemplateService.loadTemplate('templates/predios-list.html');
      const itemTemplate = await TemplateService.loadTemplate('templates/predios-item.html');
      const searchBarTemplate = await TemplateService.loadTemplate('templates/search-bar.html');

      container.innerHTML = listTemplate;

      // Inject search bar
      const searchSection = container.querySelector('#search-filters-section');
      if (searchSection) {
        searchSection.innerHTML = searchBarTemplate;
      }

      const listContainer = container.querySelector('#properties-list');
      if (!listContainer) return;

      // Filter properties
      const filteredProperties = filterProperties(properties);
      totalItems = filteredProperties.length;
      
      // Calculate pagination
      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      
      const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, totalItems);
      const paginatedProperties = filteredProperties.slice(start - 1, end);

      if (paginatedProperties.length === 0) {
        const emptyTemplate = await TemplateService.loadTemplate('templates/empty-state.html');
        const message = properties.length === 0
          ? 'No hay predios registrados.'
          : 'No se encontraron predios con los filtros aplicados.';
        listContainer.innerHTML = TemplateService.injectData(emptyTemplate, { message });
      } else {
        const itemsHtml = paginatedProperties.map(prop => {
          return TemplateService.injectData(itemTemplate, {
            id: prop.id,
            number: prop.number,
            ownerName: prop.ownerName,
            status: prop.status,
            statusClass: getStatusClass(prop.status as ServiceStatus)
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
        // Remove pagination if exists
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
        currentPage = 1; // Reset to first page
        const searchInput = container.querySelector('#search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        container.querySelectorAll('.filter-status-btn').forEach(btn => {
          btn.classList.remove('active', 'bg-upb-red', 'text-white', 'border-upb-red');
          btn.classList.add('border-slate-300', 'text-slate-700');
        });
        const allBtn = container.querySelector('[data-filter-status="all"]');
        if (allBtn) {
          allBtn.classList.add('active', 'bg-upb-red', 'text-white', 'border-upb-red');
          allBtn.classList.remove('border-slate-300', 'text-slate-700');
        }
        renderList();
      });

      // Setup status filter buttons
      container.querySelectorAll('.filter-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const status = (btn as HTMLElement).dataset.filterStatus || null;
          statusFilter = status === 'all' ? null : status;
          
          // Update button states
          container.querySelectorAll('.filter-status-btn').forEach(b => {
            b.classList.remove('active', 'bg-upb-red', 'text-white', 'border-upb-red');
            b.classList.add('border-slate-300', 'text-slate-700');
          });
          btn.classList.add('active', 'bg-upb-red', 'text-white', 'border-upb-red');
          btn.classList.remove('border-slate-300', 'text-slate-700');
          
          currentPage = 1; // Reset to first page when filter changes
          renderList();
        });
      });

      // Configurar event listeners
      const newBtn = container.querySelector('#new-property-btn');
      newBtn?.addEventListener('click', () => {
        isEditing = true;
        editingId = null;
        formData = { ownerName: '', number: '', status: ServiceStatus.ACTIVE, notes: '' };
        renderForm();
      });

      // Export PDF button
      const exportPdfBtn = container.querySelector('#export-pdf-btn');
      exportPdfBtn?.addEventListener('click', () => {
        const filtered = filterProperties(properties);
        const filters: string[] = [];
        if (searchQuery.trim()) filters.push(`Búsqueda: "${searchQuery}"`);
        if (statusFilter && statusFilter !== 'all') filters.push(`Estado: ${statusFilter}`);
        PdfService.generatePropertiesPDF(filtered, filters.length > 0 ? filters.join(', ') : undefined);
      });

      container.querySelectorAll('.edit-property-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const propId = (btn as HTMLElement).dataset.propertyId;
          const prop = properties.find(p => p.id === propId);
          if (prop) handleEdit(prop);
        });
      });
    } catch (error) {
      console.error('Error rendering list:', error);
      container.innerHTML = '<div class="p-4 text-red-600">Error al cargar la lista de predios</div>';
    }
  }

  // Renderizar vista inicial
  if (isEditing) {
    await renderForm();
  } else {
    await renderList();
  }
}
