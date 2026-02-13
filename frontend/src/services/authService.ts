// Capa de Servicios - Autenticación
// In dev, point directly to backend so requests always hit it (avoids proxy issues)
const API_BASE = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:3000/api'
  : '/api';
const TOKEN_KEY = 'acueducto_token';
const USER_KEY = 'acueducto_user';

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  _id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email?: string;
  active: boolean;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface VerifyResponse {
  valid: boolean;
  user?: User;
  error?: string;
}

// Permisos por rol (espejo del backend)
const RolePermissions: Record<UserRole, string[]> = {
  admin: ['*'],
  operator: [
    'properties:read', 'properties:create', 'properties:update',
    'payments:read', 'payments:create', 'payments:update',
    'incidents:read', 'incidents:create', 'incidents:update',
    'reports:read', 'backup:read'
  ],
  viewer: [
    'properties:read',
    'payments:read',
    'incidents:read',
    'reports:read'
  ]
};

export class AuthService {
  private static currentUser: User | null = null;
  private static authListeners: ((user: User | null) => void)[] = [];

  /**
   * Inicializar servicio - verificar token existente
   */
  static async initialize(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      this.currentUser = null;
      return false;
    }

    try {
      const isValid = await this.verifyToken();
      return isValid;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  /**
   * Login con username y password
   */
  static async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error de autenticación' };
      }

      // Guardar token y usuario
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      this.currentUser = data.user;
      this.notifyListeners();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Logout - limpiar token y usuario
   */
  static logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser = null;
    this.notifyListeners();
  }

  /**
   * Verificar token actual con el servidor
   */
  static async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data: VerifyResponse = await response.json();
      if (data.valid && data.user) {
        this.currentUser = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        this.notifyListeners();
        return true;
      }

      this.logout();
      return false;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Obtener token actual
   */
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Obtener usuario actual
   */
  static getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;

    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        this.currentUser = JSON.parse(userJson);
        return this.currentUser;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  static isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  static hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const permissions = RolePermissions[user.role];
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }

  /**
   * Verificar si el usuario tiene uno de los roles especificados
   */
  static hasRole(...roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al cambiar contraseña' };
      }

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  static async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  }

  /**
   * Crear usuario (solo admin)
   */
  static async createUser(
    username: string,
    password: string,
    role: UserRole,
    fullName: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({ username, password, role, fullName, email })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error al crear usuario' };
      }

      return { success: true };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Suscribirse a cambios de autenticación
   */
  static onAuthChange(listener: (user: User | null) => void): () => void {
    this.authListeners.push(listener);
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(): void {
    this.authListeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  /**
   * Hacer fetch con autenticación
   */
  static async authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers
    });
  }
}

export default AuthService;
