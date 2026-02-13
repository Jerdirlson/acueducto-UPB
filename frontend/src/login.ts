// Capa de Presentación - Módulo de Login
// Usa templates HTML separados para mantener la arquitectura en capas
import { TemplateService } from './services/templateService';
import { AuthService } from './services/authService';

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
  const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

  // Asegurar que los campos estén vacíos al cargar
  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput?.value?.trim();
    const password = passwordInput?.value;

    if (!username || !password) {
      if (errorMessage) errorMessage.textContent = 'Por favor ingrese usuario y contraseña.';
      errorDiv?.classList.remove('view-hidden');
      return;
    }

    // Deshabilitar botón mientras se procesa
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Ingresando...';
    }

    try {
      const result = await AuthService.login(username, password);

      if (result.success) {
        errorDiv?.classList.add('view-hidden');
        onLogin();
      } else {
        if (errorMessage) errorMessage.textContent = result.error || 'Usuario o contraseña incorrectos.';
        errorDiv?.classList.remove('view-hidden');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (errorMessage) errorMessage.textContent = 'Error de conexión. Intente de nuevo.';
      errorDiv?.classList.remove('view-hidden');
    } finally {
      // Rehabilitar botón
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Ingresar';
      }
    }
  });
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return AuthService.isAuthenticated();
}

/**
 * Inicializar autenticación y verificar token existente
 */
export async function initializeAuth(): Promise<boolean> {
  return AuthService.initialize();
}

/**
 * Cerrar sesión
 */
export function logout(): void {
  AuthService.logout();
}
