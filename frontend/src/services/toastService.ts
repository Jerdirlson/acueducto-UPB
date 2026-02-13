// Service for toast notifications
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export class ToastService {
  private static container: HTMLElement | null = null;

  private static ensureContainer(): void {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(this.container);
    }
  }

  static show(message: string, type: ToastType = 'info', duration: number = 3000): void {
    this.ensureContainer();
    if (!this.container) return;

    const toast = document.createElement('div');
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-amber-500'
    }[type];

    const icon = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`
    }[type];

    toast.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`;
    toast.innerHTML = `
      <div class="flex-shrink-0">${icon}</div>
      <div class="flex-1">${message}</div>
      <button class="toast-close flex-shrink-0 hover:opacity-75">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    this.container.appendChild(toast);

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => {
      this.removeToast(toast);
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }
  }

  private static removeToast(toast: HTMLElement): void {
    toast.classList.add('animate-slide-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  static success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  static error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  static info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  static warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }
}
