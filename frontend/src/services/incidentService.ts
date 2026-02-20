// Capa de Servicios - Lógica de Negocio para Incidencias
import { db } from '../db';
import { Incident as IncidentType, IncidentStatus } from '../../types';
import { DatabaseHealthService } from './databaseHealthService';

export class IncidentService {
  static async getAll(): Promise<IncidentType[]> {
    // Check database health before operation
    await DatabaseHealthService.checkHealth();
    
    const incidents = await db.getIncidents();
    return incidents.map(i => ({
      id: i.id,
      description: i.description,
      dateReported: i.dateReported,
      dateResolved: i.dateResolved,
      status: i.status as IncidentStatus,
      notes: i.notes
    }));
  }

  static async create(incident: IncidentType): Promise<IncidentType> {
    // Check database health before operation
    await DatabaseHealthService.checkHealth();

    const saved = await db.saveIncident({
      id: incident.id,
      propertyId: incident.propertyId,
      description: incident.description,
      dateReported: incident.dateReported,
      dateResolved: incident.dateResolved,
      status: incident.status,
      notes: incident.notes
    });

    return {
      id: saved.id,
      propertyId: saved.propertyId,
      description: saved.description,
      dateReported: saved.dateReported,
      dateResolved: saved.dateResolved,
      status: saved.status as IncidentStatus,
      notes: saved.notes
    };
  }

  static async update(incident: IncidentType): Promise<IncidentType> {
    // Check database health before operation
    await DatabaseHealthService.checkHealth();

    const existing = await db.getIncidents();
    const found = existing.find(i => i.id === incident.id);

    if (!found) throw new Error('Incident not found');

    const saved = await db.saveIncident({
      ...found,
      propertyId: incident.propertyId,
      description: incident.description,
      dateReported: incident.dateReported,
      dateResolved: incident.dateResolved,
      status: incident.status,
      notes: incident.notes
    });

    return {
      id: saved.id,
      propertyId: saved.propertyId,
      description: saved.description,
      dateReported: saved.dateReported,
      dateResolved: saved.dateResolved,
      status: saved.status as IncidentStatus,
      notes: saved.notes
    };
  }
}

