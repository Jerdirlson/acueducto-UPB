// Tipos compartidos para el backend

// Roles del sistema
export type UserRole = 'admin' | 'operator' | 'viewer';

// Permisos por rol
export const RolePermissions: Record<UserRole, string[]> = {
  admin: ['*'], // Acceso total
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

// Usuario del sistema
export interface User {
  _id: string;
  _rev?: string;
  type: 'user';
  username: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  email?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Payload del JWT
export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Request con usuario autenticado
export interface AuthenticatedRequest extends Express.Request {
  user?: JWTPayload;
}

export interface Property {
  id: string;
  number: string;
  ownerName: string;
  status: string;
  notes?: string;
}

export interface Payment {
  id: string;
  propertyId: string;
  amount: number;
  semester: string;
  date: string;
  status: string;
  notes?: string;
}

export interface Incident {
  id: string;
  description: string;
  dateReported: string;
  dateResolved?: string;
  status: string;
  notes?: string;
}

