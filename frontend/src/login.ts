// Capa de Presentación - Módulo de Login
// Usa templates HTML separados para mantener la arquitectura en capas
import { TemplateService } from './services/templateService';

export async function renderLogin(container: HTMLElement, onLogin: () => void) {
  try {
    const template = await TemplateService.loadTemplate('templates/login.html');
    container.innerHTML = template;
  } catch (error) {
    console.error('Error loading login template:', error);
    container.innerHTML = '<div class="p-4 text-red-600">Error al cargar la página de login</div>';
    return;
  }

  const form = container.querySelector('#login-form') as HTMLFormElement;
  const errorDiv = container.querySelector('#login-error') as HTMLElement;
  const errorMessage = container.querySelector('#error-message') as HTMLElement;
  const usernameInput = container.querySelector('#username') as HTMLInputElement;
  const passwordInput = container.querySelector('#password') as HTMLInputElement;

  // Asegurar que los campos estén vacíos al cargar
  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput?.value;
    const password = passwordInput?.value;

    if (username?.trim().toLowerCase() === 'admin' && password === '123456') {
      errorDiv?.classList.add('view-hidden');
      onLogin();
    } else {
      if (errorMessage) errorMessage.textContent = 'Usuario o contraseña incorrectos. Intente de nuevo.';
      errorDiv?.classList.remove('view-hidden');
    }
  });
}
