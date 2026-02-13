// Controlador de Autenticación
import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { UserRole } from '../types.js';

export class AuthController {
  /**
   * POST /api/auth/login
   * Iniciar sesión
   */
  static async login(req: Request, res: Response): Promise<void> {
    console.log('[Auth] POST /api/auth/login received', { username: req.body?.username });
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        return;
      }

      const result = await AuthService.login(String(username).trim(), password);

      if (!result) {
        console.log('[Auth] Login failed: invalid credentials');
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      console.log('[Auth] Login successful for user:', result.user.username, 'role:', result.user.role);
      res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (error: any) {
      console.error('Login error (check backend logs):', error?.message ?? error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/auth/logout
   * Cerrar sesión (lado del cliente elimina el token)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    // El logout se maneja en el cliente eliminando el token
    // Este endpoint es para logging/auditoría
    res.json({ success: true, message: 'Sesión cerrada' });
  }

  /**
   * GET /api/auth/verify
   * Verificar token actual
   */
  static async verify(req: Request, res: Response): Promise<void> {
    console.log('[Auth] GET /api/auth/verify received for user:', req.user?.username);
    try {
      if (!req.user) {
        console.log('[Auth] Verify failed: no user in request');
        res.status(401).json({ valid: false, error: 'No autenticado' });
        return;
      }

      // Obtener información actualizada del usuario
      const user = await AuthService.findUserById(req.user.userId);

      if (!user || !user.active) {
        console.log('[Auth] Verify failed: user not found or inactive. Using token data for offline admin.');
        // For offline admin (when CouchDB is down), trust the token data
        if (req.user.username === 'admin') {
          console.log('[Auth] Verify success: offline admin from token');
          res.json({
            valid: true,
            user: {
              _id: req.user.userId,
              username: req.user.username,
              role: req.user.role,
              fullName: 'Administrador (modo offline)',
              active: true
            }
          });
          return;
        }
        res.status(401).json({ valid: false, error: 'Usuario inactivo o no encontrado' });
        return;
      }

      const { passwordHash, ...userWithoutPassword } = user;

      res.json({
        valid: true,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ valid: false, error: 'Error interno' });
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña del usuario actual
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const success = await AuthService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      if (!success) {
        res.status(400).json({ error: 'Contraseña actual incorrecta' });
        return;
      }

      res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/auth/users
   * Obtener lista de usuarios (solo admin)
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await AuthService.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/auth/users
   * Crear nuevo usuario (solo admin)
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, role, fullName, email } = req.body;

      if (!username || !password || !role || !fullName) {
        res.status(400).json({
          error: 'Username, password, role y fullName son requeridos'
        });
        return;
      }

      if (!['admin', 'operator', 'viewer'].includes(role)) {
        res.status(400).json({ error: 'Rol inválido' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }

      const user = await AuthService.createUser(
        username,
        password,
        role as UserRole,
        fullName,
        email
      );

      if (!user) {
        res.status(500).json({ error: 'Error al crear usuario' });
        return;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json({ success: true, user: userWithoutPassword });
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.message === 'El usuario ya existe') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }

  /**
   * PUT /api/auth/users/:id
   * Actualizar usuario (solo admin)
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fullName, email, role, active } = req.body;

      if (role && !['admin', 'operator', 'viewer'].includes(role)) {
        res.status(400).json({ error: 'Rol inválido' });
        return;
      }

      const success = await AuthService.updateUser(`user:${id}`, {
        fullName,
        email,
        role,
        active
      });

      if (!success) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.json({ success: true, message: 'Usuario actualizado' });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * DELETE /api/auth/users/:id
   * Eliminar usuario (solo admin)
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // No permitir eliminar al propio usuario
      if (req.user && req.user.userId === `user:${id}`) {
        res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        return;
      }

      const success = await AuthService.deleteUser(`user:${id}`);

      if (!success) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.json({ success: true, message: 'Usuario eliminado' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/auth/me
   * Obtener perfil del usuario actual
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const user = await AuthService.findUserById(req.user.userId);

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default AuthController;
