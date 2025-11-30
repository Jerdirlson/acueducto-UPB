// Capa de Datos - localStorage para persistencia local
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

class DatabaseService {
  private readonly PROPERTIES_KEY = 'acueducto_properties';
  private readonly PAYMENTS_KEY = 'acueducto_payments';
  private readonly INCIDENTS_KEY = 'acueducto_incidents';

  // Properties
  async saveProperty(property: Property): Promise<Property> {
    const properties = await this.getProperties();
    const index = properties.findIndex(p => p.id === property.id);
    
    if (index >= 0) {
      properties[index] = property;
    } else {
      properties.push(property);
    }
    
    this.saveProperties(properties);
    return property;
  }

  async getProperties(): Promise<Property[]> {
    const data = localStorage.getItem(this.PROPERTIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  async getProperty(id: string): Promise<Property | null> {
    const properties = await this.getProperties();
    return properties.find(p => p.id === id) || null;
  }

  async deleteProperty(id: string): Promise<void> {
    const properties = await this.getProperties();
    const filtered = properties.filter(p => p.id !== id);
    this.saveProperties(filtered);
  }

  private saveProperties(properties: Property[]): void {
    localStorage.setItem(this.PROPERTIES_KEY, JSON.stringify(properties));
  }

  // Payments
  async savePayment(payment: Payment): Promise<Payment> {
    const payments = await this.getPayments();
    const index = payments.findIndex(p => p.id === payment.id);
    
    if (index >= 0) {
      payments[index] = payment;
    } else {
      payments.push(payment);
    }
    
    this.savePayments(payments);
    return payment;
  }

  async getPayments(): Promise<Payment[]> {
    const data = localStorage.getItem(this.PAYMENTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async getPaymentsByProperty(propertyId: string): Promise<Payment[]> {
    const payments = await this.getPayments();
    return payments.filter(p => p.propertyId === propertyId);
  }

  private savePayments(payments: Payment[]): void {
    localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments));
  }

  // Incidents
  async saveIncident(incident: Incident): Promise<Incident> {
    const incidents = await this.getIncidents();
    const index = incidents.findIndex(i => i.id === incident.id);
    
    if (index >= 0) {
      incidents[index] = incident;
    } else {
      incidents.push(incident);
    }
    
    this.saveIncidents(incidents);
    return incident;
  }

  async getIncidents(): Promise<Incident[]> {
    const data = localStorage.getItem(this.INCIDENTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveIncidents(incidents: Incident[]): void {
    localStorage.setItem(this.INCIDENTS_KEY, JSON.stringify(incidents));
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
    this.saveProperties(data.properties);
    this.savePayments(data.payments);
    this.saveIncidents(data.incidents);
  }
}

export const db = new DatabaseService();
