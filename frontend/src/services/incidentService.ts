// Capa de Servicios - Lógica de Negocio para Incidencias
import { db } from '../db';
import { Incident as IncidentType, IncidentStatus } from '../../types';

export class IncidentService {
  static async getAll(): Promise<IncidentType[]> {
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
    const saved = await db.saveIncident({
      id: incident.id,
      description: incident.description,
      dateReported: incident.dateReported,
      dateResolved: incident.dateResolved,
      status: incident.status,
      notes: incident.notes,
      type: 'incident'
    });
    
    return {
      id: saved.id,
      description: saved.description,
      dateReported: saved.dateReported,
      dateResolved: saved.dateResolved,
      status: saved.status as IncidentStatus,
      notes: saved.notes
    };
  }

  static async update(incident: IncidentType): Promise<IncidentType> {
    const existing = await db.getIncidents();
    const found = existing.find(i => i.id === incident.id);
    
    if (!found) throw new Error('Incident not found');
    
    const saved = await db.saveIncident({
      ...found,
      description: incident.description,
      dateReported: incident.dateReported,
      dateResolved: incident.dateResolved,
      status: incident.status,
      notes: incident.notes
    });
    
    return {
      id: saved.id,
      description: saved.description,
      dateReported: saved.dateReported,
      dateResolved: saved.dateResolved,
      status: saved.status as IncidentStatus,
      notes: saved.notes
    };
  }
}

