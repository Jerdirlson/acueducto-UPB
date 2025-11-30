// Capa de Servicios - Lógica de Negocio para Predios
import { db } from '../db';
import { Property as PropertyType, ServiceStatus } from '../../types';

export class PropertyService {
  static async getAll(): Promise<PropertyType[]> {
    const properties = await db.getProperties();
    return properties.map(p => ({
      id: p.id,
      number: p.number,
      ownerName: p.ownerName,
      status: p.status as ServiceStatus,
      notes: p.notes
    }));
  }

  static async getById(id: string): Promise<PropertyType | null> {
    const property = await db.getProperty(id);
    if (!property) return null;
    
    return {
      id: property.id,
      number: property.number,
      ownerName: property.ownerName,
      status: property.status as ServiceStatus,
      notes: property.notes
    };
  }

  static async create(property: PropertyType): Promise<PropertyType> {
    const saved = await db.saveProperty({
      id: property.id,
      number: property.number,
      ownerName: property.ownerName,
      status: property.status,
      notes: property.notes
    });
    
    return {
      id: saved.id,
      number: saved.number,
      ownerName: saved.ownerName,
      status: saved.status as ServiceStatus,
      notes: saved.notes
    };
  }

  static async update(property: PropertyType): Promise<PropertyType> {
    const existing = await db.getProperty(property.id);
    if (!existing) throw new Error('Property not found');
    
    const saved = await db.saveProperty({
      ...existing,
      number: property.number,
      ownerName: property.ownerName,
      status: property.status,
      notes: property.notes
    });
    
    return {
      id: saved.id,
      number: saved.number,
      ownerName: saved.ownerName,
      status: saved.status as ServiceStatus,
      notes: saved.notes
    };
  }

  static async delete(id: string): Promise<void> {
    await db.deleteProperty(id);
  }
}

