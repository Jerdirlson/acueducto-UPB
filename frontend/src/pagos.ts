// Capa de Presentación - Módulo de Pagos
// Usa templates HTML separados para mantener la arquitectura en capas
import { Payment, Property, PaymentStatus } from '../types';
import { TemplateService } from './services/templateService';
import { PdfService } from './services/pdfService';

export async function renderPayments(
  container: HTMLElement,
  payments: Payment[],
  properties: Property[],
  onAddPayment: (p: Payment) => void
) {
  let isAdding = false;
  let filterSemester = '';
  let searchQuery = '';
  let statusFilter: string | null = null;
  let dateFromFilter = '';
  let dateToFilter = '';
  let debounceTimer: number | null = null;
  
  // Pagination state
  let currentPage = 1;
  const itemsPerPage = 20;
  let totalItems = 0;

  function getPropertyLabel(id: string): string {
    const p = properties.find(prop => prop.id === id);
    return p ? `${p.number} - ${p.ownerName}` : 'Desconocido';
  }

  function getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PAID: return 'bg-green-100 text-green-800 border-green-200';
      case PaymentStatus.LATE: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  }

  async function renderForm() {
    try {
      const template = await TemplateService.loadTemplate('templates/pagos-form.html');
      const today = new Date().toISOString().split('T')[0];
      
      const propertyOptions = properties.map(p => 
        `<option value="${p.id}">${p.number} - ${p.ownerName}</option>`
      ).join('');

      const statusOptions = [
        PaymentStatus.PAID,
        PaymentStatus.PENDING,
        PaymentStatus.LATE
      ].map(status => `<option value="${status}">${status}</option>`).join('');

      const html = TemplateService.injectData(template, {
        propertyOptions,
        today,
        statusOptions
      });

      container.innerHTML = html;

      const form = container.querySelector('#payment-form') as HTMLFormElement;
      const cancelBtn = container.querySelector('#cancel-payment-btn');

      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const propertyId = (container.querySelector('#propertyId') as HTMLSelectElement)?.value;
        const amount = parseFloat((container.querySelector('#amount') as HTMLInputElement)?.value || '0');
        const date = (container.querySelector('#date') as HTMLInputElement)?.value;
        const semester = (container.querySelector('#semester') as HTMLInputElement)?.value;
        const status = (container.querySelector('#status') as HTMLSelectElement)?.value as PaymentStatus;

        if (!propertyId || !amount) return;

        onAddPayment({
          id: crypto.randomUUID(),
          propertyId,
          amount,
          date,
          semester,
          status
        });

        isAdding = false;
        renderList();
      });

      cancelBtn?.addEventListener('click', () => {
        isAdding = false;
        renderList();
      });
    } catch (error) {
      console.error('Error rendering payment form:', error);
      container.innerHTML = '<div class="p-4 text-red-600">Error al cargar el formulario</div>';
    }
  }

  function filterPayments(items: Payment[]): Payment[] {
    let filtered = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pay => {
        const property = properties.find(p => p.id === pay.propertyId);
        return (
          property?.ownerName.toLowerCase().includes(query) ||
          property?.number.toLowerCase().includes(query) ||
          pay.semester.toLowerCase().includes(query) ||
          pay.amount.toString().includes(query) ||
          (pay.notes && pay.notes.toLowerCase().includes(query))
        );
      });
    }

    // Semester filter
    if (filterSemester.trim()) {
      filtered = filtered.filter(pay => pay.semester.includes(filterSemester));
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(pay => pay.status === statusFilter);
    }

    // Date range filter
    if (dateFromFilter) {
      filtered = filtered.filter(pay => pay.date >= dateFromFilter);
    }
    if (dateToFilter) {
      filtered = filtered.filter(pay => pay.date <= dateToFilter);
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
    if (filterSemester.trim()) {
      activeFilters.push(`Semestre: ${filterSemester}`);
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
      const listTemplate = await TemplateService.loadTemplate('templates/pagos-list.html');
      const itemTemplate = await TemplateService.loadTemplate('templates/pagos-item.html');
      const searchBarTemplate = await TemplateService.loadTemplate('templates/search-bar.html');

      const html = TemplateService.injectData(listTemplate, {
        filterSemester
      });

      container.innerHTML = html;

      // Inject search bar
      const searchSection = container.querySelector('#search-filters-section');
      if (searchSection) {
        searchSection.innerHTML = searchBarTemplate;
      }

      const listContainer = container.querySelector('#payments-list');
      if (!listContainer) return;

      // Filter payments
      const filteredPayments = filterPayments(payments);
      totalItems = filteredPayments.length;
      
      // Calculate pagination
      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      
      const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, totalItems);
      const paginatedPayments = filteredPayments.slice(start - 1, end);

      if (paginatedPayments.length === 0) {
        const emptyTemplate = await TemplateService.loadTemplate('templates/empty-state.html');
        const message = payments.length === 0
          ? 'No hay pagos registrados.'
          : 'No se encontraron pagos con los filtros aplicados.';
        listContainer.innerHTML = TemplateService.injectData(emptyTemplate, { message });
      } else {
        const itemsHtml = paginatedPayments.map(pay => {
          return TemplateService.injectData(itemTemplate, {
            propertyLabel: getPropertyLabel(pay.propertyId),
            date: pay.date,
            semester: pay.semester,
            amount: pay.amount.toLocaleString(),
            status: pay.status,
            statusClass: getStatusClass(pay.status as PaymentStatus)
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
        filterSemester = '';
        statusFilter = null;
        dateFromFilter = '';
        dateToFilter = '';
        currentPage = 1; // Reset to first page
        const searchInput = container.querySelector('#search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        const semesterInput = container.querySelector('#semester-filter') as HTMLInputElement;
        if (semesterInput) semesterInput.value = '';
        const statusSelect = container.querySelector('#payment-status-filter') as HTMLSelectElement;
        if (statusSelect) statusSelect.value = 'all';
        const dateFrom = container.querySelector('#date-from-filter') as HTMLInputElement;
        if (dateFrom) dateFrom.value = '';
        const dateTo = container.querySelector('#date-to-filter') as HTMLInputElement;
        if (dateTo) dateTo.value = '';
        renderList();
      });

      // Setup filters
      const newBtn = container.querySelector('#new-payment-btn');
      const semesterInput = container.querySelector('#semester-filter') as HTMLInputElement;
      const statusSelect = container.querySelector('#payment-status-filter') as HTMLSelectElement;
      const dateFromInput = container.querySelector('#date-from-filter') as HTMLInputElement;
      const dateToInput = container.querySelector('#date-to-filter') as HTMLInputElement;

      newBtn?.addEventListener('click', () => {
        isAdding = true;
        renderForm();
      });

      // Export PDF button
      const exportPdfBtn = container.querySelector('#export-pdf-btn');
      exportPdfBtn?.addEventListener('click', () => {
        const filtered = filterPayments(payments);
        const filters: string[] = [];
        if (searchQuery.trim()) filters.push(`Búsqueda: "${searchQuery}"`);
        if (filterSemester.trim()) filters.push(`Semestre: ${filterSemester}`);
        if (statusFilter && statusFilter !== 'all') filters.push(`Estado: ${statusFilter}`);
        if (dateFromFilter || dateToFilter) {
          const dateRange = dateFromFilter && dateToFilter
            ? `${dateFromFilter} - ${dateToFilter}`
            : dateFromFilter || dateToFilter;
          filters.push(`Fechas: ${dateRange}`);
        }
        PdfService.generatePaymentsPDF(filtered, properties, filters.length > 0 ? filters.join(', ') : undefined);
      });

      if (semesterInput) {
        semesterInput.value = filterSemester;
        semesterInput.addEventListener('input', (e) => {
          filterSemester = (e.target as HTMLInputElement).value;
          currentPage = 1;
          renderList();
        });
      }

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
    } catch (error) {
      console.error('Error rendering payments list:', error);
      container.innerHTML = '<div class="p-4 text-red-600">Error al cargar la lista de pagos</div>';
    }
  }

  if (isAdding) {
    await renderForm();
  } else {
    await renderList();
  }
}
