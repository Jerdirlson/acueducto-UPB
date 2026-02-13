// Capa de Servicios - Lógica de Negocio para CouchDB
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import { Property, Payment, Incident } from '../types.js';

// Registrar plugin find
PouchDB.plugin(PouchDBFind);

interface CouchDBDocument {
  _id: string;
  _rev?: string;
  type: string;
  [key: string]: any;
}

export class CouchDBService {
  private db: PouchDB.Database;
  private connectionChecked: boolean = false;
  private isConnected: boolean = false;
  private lastChecked: Date | null = null;
  private lastError: string | null = null;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    try {
      const url = this.buildDatabaseUrl();
      console.log('🔗 Intentando conectar a CouchDB...');
      this.db = new PouchDB(url);
      // Iniciar verificación de conexión
      this.checkConnection().catch(err => {
        console.warn('⚠️ CouchDB no disponible, trabajando en modo offline:', err.message);
        this.isConnected = false;
      });
    } catch (error: any) {
      console.warn('⚠️ Error al inicializar CouchDB, trabajando en modo offline:', error.message);
      this.isConnected = false;
      // Crear una instancia local temporal para evitar errores
      this.db = new PouchDB('temp-offline-db');
    }
  }

  startHealthCheck(): void {
    if (this.healthCheckInterval) return;

    // Run immediately, then every 10 seconds
    this.performHealthCheck();
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000);

    console.log('🔄 CouchDB health check started (every 10s)');
  }

  private async performHealthCheck(): Promise<void> {
    try {
      await this.db.info();
      if (!this.isConnected) {
        console.log('✅ CouchDB reconectado');
      }
      this.isConnected = true;
      this.lastError = null;
    } catch (error: any) {
      if (this.isConnected) {
        console.warn('⚠️ CouchDB desconectado:', error.message);
      }
      this.isConnected = false;
      this.lastError = error.message || 'Connection failed';
    }
    this.lastChecked = new Date();
    this.connectionChecked = true;
  }

  getRealtimeStatus(): { connected: boolean; lastChecked: string | null; error: string | null } {
    return {
      connected: this.isConnected,
      lastChecked: this.lastChecked ? this.lastChecked.toISOString() : null,
      error: this.lastError
    };
  }

  private buildDatabaseUrl(): string {
    const baseUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
    const user = process.env.COUCHDB_USER || 'admin';
    const password = process.env.COUCHDB_PASSWORD || '';
    const dbName = process.env.COUCHDB_DB_NAME || 'acueducto';

    // Si la URL ya incluye autenticación, usarla directamente
    if (baseUrl.includes('@')) {
      return `${baseUrl}/${dbName}`;
    }

    // Construir URL con autenticación
    const protocol = baseUrl.split('://')[0];
    const host = baseUrl.split('://')[1];
    return `${protocol}://${user}:${password}@${host}/${dbName}`;
  }

  private async checkConnection(): Promise<void> {
    try {
      await this.db.info();
      this.isConnected = true;
      this.connectionChecked = true;
      console.log('✅ CouchDB conectado exitosamente');
    } catch (error: any) {
      this.isConnected = false;
      this.connectionChecked = true;
      console.warn('⚠️ CouchDB no disponible (modo offline):', error.message);
      // Lanzar error para que el constructor lo capture
      throw error;
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      const info = await this.db.info();
      this.isConnected = true;
      return { connected: true };
    } catch (error: any) {
      this.isConnected = false;
      return {
        connected: false,
        error: error.message || 'Connection failed'
      };
    }
  }

  async performHealthCheck(): Promise<{
    connected: boolean;
    readable: boolean;
    writable: boolean;
    latency: number;
    error?: string;
    timestamp: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Step 1: Check connection with db.info()
      const info = await this.db.info();
      
      // Step 2: Attempt to read a health check document
      const healthDocId = '_design/health';
      let readable = false;
      
      try {
        await this.db.get(healthDocId);
        readable = true;
      } catch (err: any) {
        if (err.status === 404) {
          // Document doesn't exist but we can read
          readable = true;
        } else {
          throw err;
        }
      }
      
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        readable: readable,
        writable: true, // Assume writable if readable (avoid extra write for performance)
        latency,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        connected: false,
        readable: false,
        writable: false,
        latency: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener instancia de la base de datos para uso externo
   * Siempre devuelve la instancia - el llamador debe manejar errores
   */
  getDatabase(): PouchDB.Database {
    return this.db;
  }

  /**
   * Verificar si la conexión está activa
   */
  async ensureConnection(): Promise<boolean> {
    try {
      await this.db.info();
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  // Transform CouchDB document to Property
  private couchDocToProperty(doc: CouchDBDocument): Property {
    return {
      id: doc.id || doc._id.replace('property:', ''),
      number: doc.number,
      ownerName: doc.ownerName,
      status: doc.status,
      notes: doc.notes
    };
  }

  // Transform Property to CouchDB document
  private propertyToCouchDoc(property: Property, rev?: string): CouchDBDocument {
    const doc: CouchDBDocument = {
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

  // Transform CouchDB document to Payment
  private couchDocToPayment(doc: CouchDBDocument): Payment {
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

  // Transform Payment to CouchDB document
  private paymentToCouchDoc(payment: Payment, rev?: string): CouchDBDocument {
    const doc: CouchDBDocument = {
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

  // Transform CouchDB document to Incident
  private couchDocToIncident(doc: CouchDBDocument): Incident {
    return {
      id: doc.id || doc._id.replace('incident:', ''),
      description: doc.description,
      dateReported: doc.dateReported,
      dateResolved: doc.dateResolved,
      status: doc.status,
      notes: doc.notes
    };
  }

  // Transform Incident to CouchDB document
  private incidentToCouchDoc(incident: Incident, rev?: string): CouchDBDocument {
    const doc: CouchDBDocument = {
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

  // Properties CRUD
  async getAllProperties(): Promise<Property[]> {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        startkey: 'property:',
        endkey: 'property:\ufff0'
      });

      return result.rows
        .map((row: any) => row.doc as CouchDBDocument)
        .filter((doc: CouchDBDocument) => doc.type === 'property')
        .map((doc: CouchDBDocument) => this.couchDocToProperty(doc));
    } catch (error) {
      console.error('Error getting properties:', error);
      throw error;
    }
  }

  async getProperty(id: string): Promise<Property | null> {
    try {
      const doc = await this.db.get(`property:${id}`) as CouchDBDocument;
      return this.couchDocToProperty(doc);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createProperty(property: Property): Promise<Property> {
    try {
      const doc = this.propertyToCouchDoc(property);
      const result = await this.db.put(doc);
      return { ...property };
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  async updateProperty(property: Property): Promise<Property> {
    try {
      const existing = await this.db.get(`property:${property.id}`) as CouchDBDocument;
      const doc = this.propertyToCouchDoc(property, existing._rev);
      await this.db.put(doc);
      return { ...property };
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  async deleteProperty(id: string): Promise<void> {
    try {
      const doc = await this.db.get(`property:${id}`) as CouchDBDocument;
      await this.db.remove(doc._id, doc._rev!);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  // Payments CRUD
  async getAllPayments(): Promise<Payment[]> {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        startkey: 'payment:',
        endkey: 'payment:\ufff0'
      });

      return result.rows
        .map((row: any) => row.doc as CouchDBDocument)
        .filter((doc: CouchDBDocument) => doc.type === 'payment')
        .map((doc: CouchDBDocument) => this.couchDocToPayment(doc));
    } catch (error) {
      console.error('Error getting payments:', error);
      throw error;
    }
  }

  async getPayment(id: string): Promise<Payment | null> {
    try {
      const doc = await this.db.get(`payment:${id}`) as CouchDBDocument;
      return this.couchDocToPayment(doc);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createPayment(payment: Payment): Promise<Payment> {
    try {
      const doc = this.paymentToCouchDoc(payment);
      await this.db.put(doc);
      return { ...payment };
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async updatePayment(payment: Payment): Promise<Payment> {
    try {
      const existing = await this.db.get(`payment:${payment.id}`) as CouchDBDocument;
      const doc = this.paymentToCouchDoc(payment, existing._rev);
      await this.db.put(doc);
      return { ...payment };
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  async deletePayment(id: string): Promise<void> {
    try {
      const doc = await this.db.get(`payment:${id}`) as CouchDBDocument;
      await this.db.remove(doc._id, doc._rev!);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  // Incidents CRUD
  async getAllIncidents(): Promise<Incident[]> {
    try {
      const result = await this.db.allDocs({
        include_docs: true,
        startkey: 'incident:',
        endkey: 'incident:\ufff0'
      });

      return result.rows
        .map((row: any) => row.doc as CouchDBDocument)
        .filter((doc: CouchDBDocument) => doc.type === 'incident')
        .map((doc: CouchDBDocument) => this.couchDocToIncident(doc));
    } catch (error) {
      console.error('Error getting incidents:', error);
      throw error;
    }
  }

  async getIncident(id: string): Promise<Incident | null> {
    try {
      const doc = await this.db.get(`incident:${id}`) as CouchDBDocument;
      return this.couchDocToIncident(doc);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createIncident(incident: Incident): Promise<Incident> {
    try {
      const doc = this.incidentToCouchDoc(incident);
      await this.db.put(doc);
      return { ...incident };
    } catch (error) {
      console.error('Error creating incident:', error);
      throw error;
    }
  }

  async updateIncident(incident: Incident): Promise<Incident> {
    try {
      const existing = await this.db.get(`incident:${incident.id}`) as CouchDBDocument;
      const doc = this.incidentToCouchDoc(incident, existing._rev);
      await this.db.put(doc);
      return { ...incident };
    } catch (error) {
      console.error('Error updating incident:', error);
      throw error;
    }
  }

  async deleteIncident(id: string): Promise<void> {
    try {
      const doc = await this.db.get(`incident:${id}`) as CouchDBDocument;
      await this.db.remove(doc._id, doc._rev!);
    } catch (error) {
      console.error('Error deleting incident:', error);
      throw error;
    }
  }
}

// Singleton instance
export const couchdbService = new CouchDBService();

