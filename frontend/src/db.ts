// Capa de Datos - PouchDB sobre IndexedDB para persistencia local
import PouchDB from 'pouchdb';
import type { Property, Payment, Incident } from '../types';

interface PouchDBDocument {
  _id: string;
  _rev?: string;
  type: string;
  [key: string]: any;
}

class DatabaseService {
  private db: PouchDB.Database;

  constructor() {
    // Inicializar PouchDB local usando IndexedDB
    this.db = new PouchDB('acueducto-local');
  }

  // Transform PouchDB document to Property
  private docToProperty(doc: PouchDBDocument): Property {
    return {
      id: doc.id || doc._id.replace('property:', ''),
      number: doc.number,
      ownerName: doc.ownerName,
      status: doc.status,
      notes: doc.notes
    };
  }

  // Transform Property to PouchDB document
  private propertyToDoc(property: Property, rev?: string): PouchDBDocument {
    const doc: PouchDBDocument = {
      _id: `property:${property.id}`,
      type: 'property',
      id: property.id,
      number: property.number,
      ownerName: property.ownerName,
      status: property.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (rev) {
      doc._rev = rev;
    }

    if (property.notes) {
      doc.notes = property.notes;
    }

    return doc;
  }

  // Transform PouchDB document to Payment
  private docToPayment(doc: PouchDBDocument): Payment {
    return {
      id: doc.id || doc._id.replace('payment:', ''),
      propertyId: doc.propertyId,
      amount: doc.amount,
      semester: doc.semester,
      date: doc.date,
      status: doc.status,
      notes: doc.notes
    };
  }

  // Transform Payment to PouchDB document
  private paymentToDoc(payment: Payment, rev?: string): PouchDBDocument {
    const doc: PouchDBDocument = {
      _id: `payment:${payment.id}`,
      type: 'payment',
      id: payment.id,
      propertyId: payment.propertyId,
      amount: payment.amount,
      semester: payment.semester,
      date: payment.date,
      status: payment.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (rev) {
      doc._rev = rev;
    }

    if (payment.notes) {
      doc.notes = payment.notes;
    }

    return doc;
  }

  // Transform PouchDB document to Incident
  private docToIncident(doc: PouchDBDocument): Incident {
    return {
      id: doc.id || doc._id.replace('incident:', ''),
      description: doc.description,
      dateReported: doc.dateReported,
      dateResolved: doc.dateResolved,
      status: doc.status,
      notes: doc.notes
    };
  }

  // Transform Incident to PouchDB document
  private incidentToDoc(incident: Incident, rev?: string): PouchDBDocument {
    const doc: PouchDBDocument = {
      _id: `incident:${incident.id}`,
      type: 'incident',
      id: incident.id,
      description: incident.description,
      dateReported: incident.dateReported,
      status: incident.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (rev) {
      doc._rev = rev;
    }

    if (incident.dateResolved) {
      doc.dateResolved = incident.dateResolved;
    }

    if (incident.notes) {
      doc.notes = incident.notes;
    }

    return doc;
  }

  // Properties
  async saveProperty(property: Property): Promise<Property> {
    try {
      const docId = `property:${property.id}`;
      let existingDoc: PouchDBDocument | null = null;

      try {
        existingDoc = await this.db.get(docId) as PouchDBDocument;
      } catch (error: any) {
        if (error.status !== 404) throw error;
      }

      const doc = this.propertyToDoc(property, existingDoc?._rev);
      await this.db.put(doc);
      return property;
    } catch (error) {
      console.error('Error saving property:', error);
      throw error;
    }
  }

  async getProperties(): Promise<Property[]> {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        startkey: 'property:',
        endkey: 'property:\ufff0'
      });

      return result.rows
        .map(row => row.doc as PouchDBDocument)
        .filter(doc => doc.type === 'property')
        .map(doc => this.docToProperty(doc));
    } catch (error) {
      console.error('Error getting properties:', error);
      return [];
    }
  }

  async getProperty(id: string): Promise<Property | null> {
    try {
      const doc = await this.db.get(`property:${id}`) as PouchDBDocument;
      return this.docToProperty(doc);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteProperty(id: string): Promise<void> {
    try {
      const doc = await this.db.get(`property:${id}`) as PouchDBDocument;
      await this.db.remove(doc);
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
    }
  }

  // Payments
  async savePayment(payment: Payment): Promise<Payment> {
    try {
      const docId = `payment:${payment.id}`;
      let existingDoc: PouchDBDocument | null = null;

      try {
        existingDoc = await this.db.get(docId) as PouchDBDocument;
      } catch (error: any) {
        if (error.status !== 404) throw error;
      }

      const doc = this.paymentToDoc(payment, existingDoc?._rev);
      await this.db.put(doc);
      return payment;
    } catch (error) {
      console.error('Error saving payment:', error);
      throw error;
    }
  }

  async getPayments(): Promise<Payment[]> {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        startkey: 'payment:',
        endkey: 'payment:\ufff0'
      });

      return result.rows
        .map(row => row.doc as PouchDBDocument)
        .filter(doc => doc.type === 'payment')
        .map(doc => this.docToPayment(doc));
    } catch (error) {
      console.error('Error getting payments:', error);
      return [];
    }
  }

  async getPaymentsByProperty(propertyId: string): Promise<Payment[]> {
    const payments = await this.getPayments();
    return payments.filter(p => p.propertyId === propertyId);
  }

  // Incidents
  async saveIncident(incident: Incident): Promise<Incident> {
    try {
      const docId = `incident:${incident.id}`;
      let existingDoc: PouchDBDocument | null = null;

      try {
        existingDoc = await this.db.get(docId) as PouchDBDocument;
      } catch (error: any) {
        if (error.status !== 404) throw error;
      }

      const doc = this.incidentToDoc(incident, existingDoc?._rev);
      await this.db.put(doc);
      return incident;
    } catch (error) {
      console.error('Error saving incident:', error);
      throw error;
    }
  }

  async getIncidents(): Promise<Incident[]> {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        startkey: 'incident:',
        endkey: 'incident:\ufff0'
      });

      return result.rows
        .map(row => row.doc as PouchDBDocument)
        .filter(doc => doc.type === 'incident')
        .map(doc => this.docToIncident(doc));
    } catch (error) {
      console.error('Error getting incidents:', error);
      return [];
    }
  }

  // Backup & Restore
  async exportAll(): Promise<{ properties: Property[]; payments: Payment[]; incidents: Incident[] }> {
    return {
      properties: await this.getProperties(),
      payments: await this.getPayments(),
      incidents: await this.getIncidents()
    };
  }

  async importAll(data: { properties: Property[]; payments: Payment[]; incidents: Incident[] }): Promise<void> {
    // Save properties
    for (const property of data.properties) {
      await this.saveProperty(property);
    }

    // Save payments
    for (const payment of data.payments) {
      await this.savePayment(payment);
    }

    // Save incidents
    for (const incident of data.incidents) {
      await this.saveIncident(incident);
    }
  }

  // Get PouchDB instance for sync
  getPouchDB(): PouchDB.Database {
    return this.db;
  }
}

export const db = new DatabaseService();
