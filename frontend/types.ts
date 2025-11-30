export enum ServiceStatus {
  ACTIVE = 'Activo',
  SUSPENDED = 'Suspendido',
  INACTIVE = 'Inactivo'
}

export interface Property {
  id: string;
  number: string;
  ownerName: string;
  status: ServiceStatus;
  notes?: string;
}

export enum PaymentStatus {
  PAID = 'Pagado',
  PENDING = 'Pendiente',
  LATE = 'En Mora'
}

export interface Payment {
  id: string;
  propertyId: string;
  amount: number;
  semester: string; // Format: "2024-1", "2024-2"
  date: string;
  status: PaymentStatus;
  notes?: string;
}

export enum IncidentStatus {
  OPEN = 'Abierta',
  IN_PROGRESS = 'En Proceso',
  RESOLVED = 'Resuelta'
}

export interface Incident {
  id: string;
  description: string;
  dateReported: string;
  dateResolved?: string;
  status: IncidentStatus;
  notes?: string;
}

export type ViewState = 'PROPERTIES' | 'PAYMENTS' | 'INCIDENTS' | 'REPORTS' | 'BACKUP';

