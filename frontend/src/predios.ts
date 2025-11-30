// Capa de Presentación - Módulo de Predios
// Usa templates HTML separados para mantener la arquitectura en capas
import { Property, ServiceStatus } from '../types';
import { TemplateService } from './services/templateService';

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

  async function renderList() {
    try {
      const listTemplate = await TemplateService.loadTemplate('templates/predios-list.html');
      const itemTemplate = await TemplateService.loadTemplate('templates/predios-item.html');

      container.innerHTML = listTemplate;

      const listContainer = container.querySelector('#properties-list');
      if (!listContainer) return;

      if (properties.length === 0) {
        const emptyTemplate = await TemplateService.loadTemplate('templates/empty-state.html');
        listContainer.innerHTML = TemplateService.injectData(emptyTemplate, {
          message: 'No hay predios registrados.'
        });
      } else {
        const itemsHtml = properties.map(prop => {
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

      // Configurar event listeners
      const newBtn = container.querySelector('#new-property-btn');
      newBtn?.addEventListener('click', () => {
        isEditing = true;
        editingId = null;
        formData = { ownerName: '', number: '', status: ServiceStatus.ACTIVE, notes: '' };
        renderForm();
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
