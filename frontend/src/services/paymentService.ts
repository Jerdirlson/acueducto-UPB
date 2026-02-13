// Capa de Servicios - Lógica de Negocio para Pagos
import { db } from '../db';
import { Payment as PaymentType, PaymentStatus } from '../../types';
import { DatabaseHealthService } from './databaseHealthService';

export class PaymentService {
  static async getAll(): Promise<PaymentType[]> {
    // Check database health before operation
    await DatabaseHealthService.checkHealth();
    
    const payments = await db.getPayments();
    return payments.map(p => ({
      id: p.id,
      propertyId: p.propertyId,
      amount: p.amount,
      semester: p.semester,
      date: p.date,
      status: p.status as PaymentStatus,
      notes: p.notes
    }));
  }

  static async create(payment: PaymentType): Promise<PaymentType> {
    // Check database health before operation
    await DatabaseHealthService.checkHealth();
    
    const saved = await db.savePayment({
      id: payment.id,
      propertyId: payment.propertyId,
      amount: payment.amount,
      semester: payment.semester,
      date: payment.date,
      status: payment.status,
      notes: payment.notes
    });
    
    return {
      id: saved.id,
      propertyId: saved.propertyId,
      amount: saved.amount,
      semester: saved.semester,
      date: saved.date,
      status: saved.status as PaymentStatus,
      notes: saved.notes
    };
  }
}

