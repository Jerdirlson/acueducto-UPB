// Capa de Presentación - Módulo de Pagos
// Usa templates HTML separados para mantener la arquitectura en capas
import { Payment, Property, PaymentStatus } from '../types';
import { TemplateService } from './services/templateService';

export async function renderPayments(
  container: HTMLElement,
  payments: Payment[],
  properties: Property[],
  onAddPayment: (p: Payment) => void
) {
  let isAdding = false;
  let filterSemester = '2024-1';

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

  async function renderList() {
    try {
      const listTemplate = await TemplateService.loadTemplate('templates/pagos-list.html');
      const itemTemplate = await TemplateService.loadTemplate('templates/pagos-item.html');

      const filteredPayments = payments.filter(p => p.semester.includes(filterSemester));

      const html = TemplateService.injectData(listTemplate, {
        filterSemester
      });

      container.innerHTML = html;

      const listContainer = container.querySelector('#payments-list');
      if (!listContainer) return;

      if (filteredPayments.length === 0) {
        const emptyTemplate = await TemplateService.loadTemplate('templates/empty-state.html');
        listContainer.innerHTML = TemplateService.injectData(emptyTemplate, {
          message: 'No hay pagos registrados para este periodo.'
        });
      } else {
        const itemsHtml = filteredPayments.map(pay => {
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

      const newBtn = container.querySelector('#new-payment-btn');
      const filterInput = container.querySelector('#semester-filter') as HTMLInputElement;

      newBtn?.addEventListener('click', () => {
        isAdding = true;
        renderForm();
      });

      filterInput?.addEventListener('input', (e) => {
        filterSemester = (e.target as HTMLInputElement).value;
        renderList();
      });
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
