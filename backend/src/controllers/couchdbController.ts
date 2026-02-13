// Capa de Controladores - Controlador de CouchDB Proxy
import { Request, Response } from 'express';
import { couchdbService } from '../services/couchdbService.js';
import { Property, Payment, Incident } from '../types.js';

export class CouchDBController {
  // Properties endpoints
  static async getProperties(req: Request, res: Response): Promise<void> {
    try {
      const properties = await couchdbService.getAllProperties();
      res.json(properties);
    } catch (error: any) {
      console.error('Error getting properties:', error);
      res.status(500).json({ error: error.message || 'Failed to get properties' });
    }
  }

  static async getProperty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const property = await couchdbService.getProperty(id);
      
      if (!property) {
        res.status(404).json({ error: 'Property not found' });
        return;
      }
      
      res.json(property);
    } catch (error: any) {
      console.error('Error getting property:', error);
      res.status(500).json({ error: error.message || 'Failed to get property' });
    }
  }

  static async createProperty(req: Request, res: Response): Promise<void> {
    try {
      const property = req.body as Property;
      const created = await couchdbService.createProperty(property);
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error creating property:', error);
      res.status(500).json({ error: error.message || 'Failed to create property' });
    }
  }

  static async updateProperty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const property = { ...req.body, id } as Property;
      const updated = await couchdbService.updateProperty(property);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating property:', error);
      if (error.status === 404) {
        res.status(404).json({ error: 'Property not found' });
      } else {
        res.status(500).json({ error: error.message || 'Failed to update property' });
      }
    }
  }

  static async deleteProperty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await couchdbService.deleteProperty(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      if (error.status === 404) {
        res.status(404).json({ error: 'Property not found' });
      } else {
        res.status(500).json({ error: error.message || 'Failed to delete property' });
      }
    }
  }

  // Payments endpoints
  static async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const payments = await couchdbService.getAllPayments();
      res.json(payments);
    } catch (error: any) {
      console.error('Error getting payments:', error);
      res.status(500).json({ error: error.message || 'Failed to get payments' });
    }
  }

  static async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await couchdbService.getPayment(id);
      
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }
      
      res.json(payment);
    } catch (error: any) {
      console.error('Error getting payment:', error);
      res.status(500).json({ error: error.message || 'Failed to get payment' });
    }
  }

  static async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const payment = req.body as Payment;
      const created = await couchdbService.createPayment(payment);
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: error.message || 'Failed to create payment' });
    }
  }

  static async updatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = { ...req.body, id } as Payment;
      const updated = await couchdbService.updatePayment(payment);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating payment:', error);
      if (error.status === 404) {
        res.status(404).json({ error: 'Payment not found' });
      } else {
        res.status(500).json({ error: error.message || 'Failed to update payment' });
      }
    }
  }

  static async deletePayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await couchdbService.deletePayment(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      if (error.status === 404) {
        res.status(404).json({ error: 'Payment not found' });
      } else {
        res.status(500).json({ error: error.message || 'Failed to delete payment' });
      }
    }
  }

  // Incidents endpoints
  static async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const incidents = await couchdbService.getAllIncidents();
      res.json(incidents);
    } catch (error: any) {
      console.error('Error getting incidents:', error);
      res.status(500).json({ error: error.message || 'Failed to get incidents' });
    }
  }

  static async getIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const incident = await couchdbService.getIncident(id);
      
      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }
      
      res.json(incident);
    } catch (error: any) {
      console.error('Error getting incident:', error);
      res.status(500).json({ error: error.message || 'Failed to get incident' });
    }
  }

  static async createIncident(req: Request, res: Response): Promise<void> {
    try {
      const incident = req.body as Incident;
      const created = await couchdbService.createIncident(incident);
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error creating incident:', error);
      res.status(500).json({ error: error.message || 'Failed to create incident' });
    }
  }

  static async updateIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const incident = { ...req.body, id } as Incident;
      const updated = await couchdbService.updateIncident(incident);
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating incident:', error);
      if (error.status === 404) {
        res.status(404).json({ error: 'Incident not found' });
      } else {
        res.status(500).json({ error: error.message || 'Failed to update incident' });
      }
    }
  }

  static async deleteIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await couchdbService.deleteIncident(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting incident:', error);
      if (error.status === 404) {
        res.status(404).json({ error: 'Incident not found' });
      } else {
        res.status(500).json({ error: error.message || 'Failed to delete incident' });
      }
    }
  }

  // Sync status endpoint - returns cached realtime status (no DB query)
  static async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = couchdbService.getRealtimeStatus();
      res.json(status);
    } catch (error: any) {
      console.error('Error getting sync status:', error.message);
      res.json({
        connected: false,
        lastChecked: null,
        error: error.message
      });
    }
  }

  // Database health check endpoint
  static async checkDatabaseHealth(req: Request, res: Response): Promise<void> {
    try {
      // Attempt to read a test document or get database info
      const status = await couchdbService.performHealthCheck();
      res.json(status);
    } catch (error: any) {
      res.json({
        connected: false,
        readable: false,
        writable: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

