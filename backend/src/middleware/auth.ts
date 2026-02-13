// Middleware de Autenticación y Autorización
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { JWTPayload, UserRole } from '../types.js';

// Extender Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware para verificar autenticación JWT
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Formato de token inválido' });
    return;
  }

  const token = parts[1];
  const payload = AuthService.verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Middleware para verificar rol mínimo
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'No tienes permisos para esta acción' });
      return;
    }

    next();
  };
}

/**
 * Middleware para verificar permiso específico
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!AuthService.hasPermission(req.user.role, permission)) {
      res.status(403).json({ error: 'No tienes permisos para esta acción' });
      return;
    }

    next();
  };
}

export default {
  authenticate,
  requireRole,
  requirePermission
};
