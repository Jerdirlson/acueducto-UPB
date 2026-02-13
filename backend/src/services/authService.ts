// Servicio de Autenticación
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, UserRole, JWTPayload, RolePermissions } from '../types.js';
import { couchdbService } from './couchdbService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'acueducto-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

// Offline fallback admin when CouchDB is not available (doc: admin / 123456)
const OFFLINE_ADMIN_USERNAME = 'admin';
const OFFLINE_ADMIN_PASSWORD = '123456';
let _offlineAdminHash: string | null = null;

async function getOfflineAdminUser(): Promise<User> {
  if (!_offlineAdminHash) {
    _offlineAdminHash = await bcrypt.hash(OFFLINE_ADMIN_PASSWORD, SALT_ROUNDS);
  }
  const now = new Date().toISOString();
  return {
    _id: `user:${OFFLINE_ADMIN_USERNAME}`,
    type: 'user',
    username: OFFLINE_ADMIN_USERNAME,
    passwordHash: _offlineAdminHash,
    role: 'admin',
    fullName: 'Administrador (modo offline)',
    email: '',
    active: true,
    createdAt: now,
    updatedAt: now
  };
}

export class AuthService {
  /**
   * Hashear una contraseña
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verificar contraseña contra hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generar token JWT
   */
  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * Verificar y decodificar token JWT
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Buscar usuario por username
   * When CouchDB is unavailable, returns offline admin (admin/123456) if username is 'admin'
   */
  static async findUserByUsername(username: string): Promise<User | null> {
    try {
      const db = couchdbService.getDatabase();
      const result = await db.find({
        selector: {
          type: 'user',
          username: username
        },
        limit: 1
      });

      if (result.docs.length === 0) {
        if (username === OFFLINE_ADMIN_USERNAME) {
          return getOfflineAdminUser();
        }
        return null;
      }
      return result.docs[0] as unknown as User;
    } catch (error: any) {
      console.warn('Auth: CouchDB unavailable, using offline fallback for admin:', error.message);
      if (username === OFFLINE_ADMIN_USERNAME) {
        return getOfflineAdminUser();
      }
      return null;
    }
  }

  /**
   * Buscar usuario por ID
   */
  static async findUserById(userId: string): Promise<User | null> {
    try {
      const db = couchdbService.getDatabase();

      const doc = await db.get(userId) as any;
      if (doc.type !== 'user') return null;
      return doc as User;
    } catch (error) {
      return null;
    }
  }

  /**
   * Login de usuario.
   * Never throws: returns null on failure so controller can return 401 instead of 500.
   */
  static async login(username: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string } | null> {
    try {
      const user = await this.findUserByUsername(username);

      if (!user || !user.active) {
        return null;
      }

      const hash = user.passwordHash;
      if (!hash || typeof hash !== 'string') {
        console.warn('Auth: user missing passwordHash');
        return null;
      }

      const isValid = await this.verifyPassword(password, hash);
      if (!isValid) {
        return null;
      }

      // Actualizar último login (skip for offline admin to avoid CouchDB call)
      if (user.fullName !== 'Administrador (modo offline)') {
        try {
          const db = couchdbService.getDatabase();
          await db.put({
            ...user,
            lastLogin: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Error updating last login (ignored):', (err as Error).message);
        }
      }

      const token = this.generateToken(user);
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error: any) {
      console.error('AuthService.login error:', error?.message || error);
      if (username === OFFLINE_ADMIN_USERNAME) {
        try {
          const offlineUser = await getOfflineAdminUser();
          const isValid = await this.verifyPassword(password, offlineUser.passwordHash);
          if (isValid) {
            const token = this.generateToken(offlineUser);
            const { passwordHash: _, ...userWithoutPassword } = offlineUser;
            return { user: userWithoutPassword, token };
          }
        } catch (fallbackErr: any) {
          console.error('Auth offline fallback error:', fallbackErr?.message || fallbackErr);
        }
      }
      return null;
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(
    username: string,
    password: string,
    role: UserRole,
    fullName: string,
    email?: string
  ): Promise<User | null> {
    try {
      const db = couchdbService.getDatabase();

      // Verificar si el usuario ya existe
      const existing = await this.findUserByUsername(username);
      if (existing) {
        throw new Error('El usuario ya existe');
      }

      const passwordHash = await this.hashPassword(password);
      const now = new Date().toISOString();

      const user: User = {
        _id: `user:${username}`,
        type: 'user',
        username,
        passwordHash,
        role,
        fullName,
        email,
        active: true,
        createdAt: now,
        updatedAt: now
      };

      const result = await db.put(user);
      user._rev = result.rev;

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.findUserById(userId);
      if (!user) return false;

      const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) return false;

      const db = couchdbService.getDatabase();
      const newHash = await this.hashPassword(newPassword);
      await db.put({
        ...user,
        passwordHash: newHash,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  /**
   * Verificar si un rol tiene un permiso específico
   */
  static hasPermission(role: UserRole, permission: string): boolean {
    const permissions = RolePermissions[role];
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  }

  /**
   * Obtener todos los usuarios (sin contraseñas)
   */
  static async getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    try {
      const db = couchdbService.getDatabase();

      const result = await db.find({
        selector: { type: 'user' }
      });

      return result.docs.map((doc: any) => {
        const { passwordHash, ...userWithoutPassword } = doc;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  /**
   * Actualizar usuario
   */
  static async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'fullName' | 'email' | 'role' | 'active'>>
  ): Promise<boolean> {
    try {
      const user = await this.findUserById(userId);
      if (!user) return false;

      const db = couchdbService.getDatabase();
      await db.put({
        ...user,
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  /**
   * Eliminar usuario
   */
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const user = await this.findUserById(userId);
      if (!user) return false;

      const db = couchdbService.getDatabase();
      await db.remove(user._id, user._rev!);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}

export default AuthService;
