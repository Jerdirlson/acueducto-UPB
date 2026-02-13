// Capa de Servicios - Servicio de Migración de localStorage a PouchDB
import { db } from '../db';
import type { Property, Payment, Incident } from '../../types';

const MIGRATION_FLAG = 'acueducto_migration_completed';

export class MigrationService {
  private readonly PROPERTIES_KEY = 'acueducto_properties';
  private readonly PAYMENTS_KEY = 'acueducto_payments';
  private readonly INCIDENTS_KEY = 'acueducto_incidents';

  async needsMigration(): Promise<boolean> {
    // Check if migration has already been completed
    const migrationCompleted = localStorage.getItem(MIGRATION_FLAG) === 'true';
    if (migrationCompleted) {
      return false;
    }

    // Check if there's data in localStorage
    const hasProperties = localStorage.getItem(this.PROPERTIES_KEY) !== null;
    const hasPayments = localStorage.getItem(this.PAYMENTS_KEY) !== null;
    const hasIncidents = localStorage.getItem(this.INCIDENTS_KEY) !== null;

    return hasProperties || hasPayments || hasIncidents;
  }

  async migrate(): Promise<{ 
    success: boolean; 
    migrated: { properties: number; payments: number; incidents: number };
    error?: string;
  }> {
    try {
      console.log('🔄 Iniciando migración de localStorage a PouchDB...');

      // Check if migration is needed
      if (!(await this.needsMigration())) {
        console.log('✅ No se requiere migración');
        return {
          success: true,
          migrated: { properties: 0, payments: 0, incidents: 0 }
        };
      }

      // Get data from localStorage
      const propertiesData = localStorage.getItem(this.PROPERTIES_KEY);
      const paymentsData = localStorage.getItem(this.PAYMENTS_KEY);
      const incidentsData = localStorage.getItem(this.INCIDENTS_KEY);

      let properties: Property[] = [];
      let payments: Payment[] = [];
      let incidents: Incident[] = [];

      if (propertiesData) {
        try {
          properties = JSON.parse(propertiesData);
        } catch (error) {
          console.error('Error parsing properties from localStorage:', error);
        }
      }

      if (paymentsData) {
        try {
          payments = JSON.parse(paymentsData);
        } catch (error) {
          console.error('Error parsing payments from localStorage:', error);
        }
      }

      if (incidentsData) {
        try {
          incidents = JSON.parse(incidentsData);
        } catch (error) {
          console.error('Error parsing incidents from localStorage:', error);
        }
      }

      // Migrate to PouchDB
      let migratedProperties = 0;
      let migratedPayments = 0;
      let migratedIncidents = 0;

      // Check if data already exists in PouchDB
      const existingProperties = await db.getProperties();
      const existingPayments = await db.getPayments();
      const existingIncidents = await db.getIncidents();

      // Only migrate if PouchDB is empty or has less data
      if (properties.length > 0 && (existingProperties.length === 0 || properties.length > existingProperties.length)) {
        for (const property of properties) {
          try {
            await db.saveProperty(property);
            migratedProperties++;
          } catch (error) {
            console.error(`Error migrating property ${property.id}:`, error);
          }
        }
      }

      if (payments.length > 0 && (existingPayments.length === 0 || payments.length > existingPayments.length)) {
        for (const payment of payments) {
          try {
            await db.savePayment(payment);
            migratedPayments++;
          } catch (error) {
            console.error(`Error migrating payment ${payment.id}:`, error);
          }
        }
      }

      if (incidents.length > 0 && (existingIncidents.length === 0 || incidents.length > existingIncidents.length)) {
        for (const incident of incidents) {
          try {
            await db.saveIncident(incident);
            migratedIncidents++;
          } catch (error) {
            console.error(`Error migrating incident ${incident.id}:`, error);
          }
        }
      }

      // Mark migration as completed
      localStorage.setItem(MIGRATION_FLAG, 'true');

      console.log('✅ Migración completada:', {
        properties: migratedProperties,
        payments: migratedPayments,
        incidents: migratedIncidents
      });

      return {
        success: true,
        migrated: {
          properties: migratedProperties,
          payments: migratedPayments,
          incidents: migratedIncidents
        }
      };
    } catch (error: any) {
      console.error('❌ Error durante migración:', error);
      return {
        success: false,
        migrated: { properties: 0, payments: 0, incidents: 0 },
        error: error.message || 'Migration failed'
      };
    }
  }

  async clearMigrationFlag(): Promise<void> {
    localStorage.removeItem(MIGRATION_FLAG);
  }
}

// Singleton instance
export const migrationService = new MigrationService();

