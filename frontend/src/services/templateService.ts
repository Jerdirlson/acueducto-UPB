// Capa de Servicios - Servicio para cargar templates HTML
// Cache de templates para evitar múltiples requests
const templateCache = new Map<string, string>();

export class TemplateService {
  /**
   * Carga un template HTML desde el servidor
   * @param templatePath Ruta relativa al template (ej: 'templates/predios.html')
   * @returns HTML del template como string
   */
  static async loadTemplate(templatePath: string): Promise<string> {
    // Verificar cache primero
    if (templateCache.has(templatePath)) {
      return templateCache.get(templatePath)!;
    }

    try {
      const response = await fetch(`/src/${templatePath}`);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templatePath}`);
      }
      const html = await response.text();
      
      // Guardar en cache
      templateCache.set(templatePath, html);
      return html;
    } catch (error) {
      console.error(`Error loading template ${templatePath}:`, error);
      throw error;
    }
  }

  /**
   * Reemplaza placeholders en un template con datos
   * @param template HTML template con placeholders {{key}}
   * @param data Objeto con los datos a inyectar
   * @returns HTML con datos inyectados
   */
  static injectData(template: string, data: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value ?? ''));
    }
    return result;
  }

  /**
   * Limpia el cache de templates
   */
  static clearCache(): void {
    templateCache.clear();
  }
}

