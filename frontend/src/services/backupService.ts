// Capa de Servicios - Lógica de Negocio para Respaldo
import { db } from '../db';
import { ApiService } from './api';
import { Property, Payment, Incident } from '../../types';

export class BackupService {
  static async exportToJSON(): Promise<{ properties: Property[]; payments: Payment[]; incidents: Incident[] }> {
    const data = await db.exportAll();
    // Convertir tipos de db a tipos de la aplicación
    return {
      properties: data.properties.map(p => ({
        id: p.id,
        number: p.number,
        ownerName: p.ownerName,
        status: p.status as any,
        notes: p.notes
      })),
      payments: data.payments.map(p => ({
        id: p.id,
        propertyId: p.propertyId,
        amount: p.amount,
        semester: p.semester,
        date: p.date,
        status: p.status as any,
        notes: p.notes
      })),
      incidents: data.incidents.map(i => ({
        id: i.id,
        description: i.description,
        dateReported: i.dateReported,
        dateResolved: i.dateResolved,
        status: i.status as any,
        notes: i.notes
      }))
    };
  }

  static async exportToCSV(type: 'properties' | 'payments' | 'incidents'): Promise<string> {
    const data = await db.exportAll();
    
    if (type === 'properties') {
      const header = 'ID,Numero,Propietario,Estado\n';
      const rows = data.properties.map(p => 
        `${p.id},${p.number},"${p.ownerName}",${p.status}`
      ).join('\n');
      return header + rows;
    } else if (type === 'payments') {
      const header = 'ID,PredioID,Fecha,Monto,Semestre,Estado\n';
      const rows = data.payments.map(p => 
        `${p.id},${p.propertyId},${p.date},${p.amount},${p.semester},${p.status}`
      ).join('\n');
      return header + rows;
    } else {
      const header = 'ID,FechaReporte,Estado,Descripcion,FechaResolucion\n';
      const rows = data.incidents.map(i => 
        `${i.id},${i.dateReported},${i.status},"${i.description.replace(/"/g, '""')}",${i.dateResolved || ''}`
      ).join('\n');
      return header + rows;
    }
  }

  static async downloadBackupFromServer(): Promise<void> {
    try {
      const blob = await ApiService.downloadBackup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `respaldo_acueducto_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup from server:', error);
      throw error;
    }
  }

  static async restoreFromFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await db.importAll(data);
    } catch (error) {
      console.error('Error restoring from file:', error);
      throw error;
    }
  }

  static async restoreFromServer(file: File): Promise<void> {
    try {
      await ApiService.uploadBackup(file);
      const text = await file.text();
      const data = JSON.parse(text);
      await db.importAll(data);
    } catch (error) {
      console.error('Error restoring from server:', error);
      throw error;
    }
  }
}

