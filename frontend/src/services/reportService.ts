// Service for report data aggregation and calculations
import { Property, Payment, Incident, ServiceStatus, PaymentStatus, IncidentStatus } from '../../types';

export interface ReportData {
  kpis: {
    totalProperties: number;
    activeProperties: number;
    suspendedProperties: number;
    inactiveProperties: number;
    currentSemesterRevenue: number;
    openIncidents: number;
    latePayments: number;
    paymentRate: number;
  };
  paymentsBySemester: Array<{
    semester: string;
    total: number;
    paid: number;
    pending: number;
    late: number;
  }>;
  propertiesByStatus: {
    active: number;
    suspended: number;
    inactive: number;
  };
  incidentsByMonth: Array<{
    month: string;
    reported: number;
    resolved: number;
  }>;
}

export class ReportService {
  static calculateReportData(
    properties: Property[],
    payments: Payment[],
    incidents: Incident[]
  ): ReportData {
    // Get current semester (format: YYYY-N)
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;
    const currentSemester = `${year}-${semester}`;

    // KPIs
    const totalProperties = properties.length;
    const activeProperties = properties.filter(p => p.status === ServiceStatus.ACTIVE).length;
    const suspendedProperties = properties.filter(p => p.status === ServiceStatus.SUSPENDED).length;
    const inactiveProperties = properties.filter(p => p.status === ServiceStatus.INACTIVE).length;

    const currentSemesterPayments = payments.filter(p => p.semester === currentSemester);
    const currentSemesterRevenue = currentSemesterPayments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.amount, 0);

    const openIncidents = incidents.filter(i => i.status === IncidentStatus.OPEN).length;
    const latePayments = currentSemesterPayments.filter(p => p.status === PaymentStatus.LATE).length;
    const paymentRate = totalProperties > 0
      ? (currentSemesterPayments.filter(p => p.status === PaymentStatus.PAID).length / totalProperties) * 100
      : 0;

    // Payments by semester
    const semesterMap = new Map<string, { total: number; paid: number; pending: number; late: number }>();
    
    payments.forEach(payment => {
      const existing = semesterMap.get(payment.semester) || { total: 0, paid: 0, pending: 0, late: 0 };
      existing.total += payment.amount;
      if (payment.status === PaymentStatus.PAID) {
        existing.paid += payment.amount;
      } else if (payment.status === PaymentStatus.LATE) {
        existing.late += payment.amount;
      } else {
        existing.pending += payment.amount;
      }
      semesterMap.set(payment.semester, existing);
    });

    const paymentsBySemester = Array.from(semesterMap.entries())
      .map(([semester, data]) => ({
        semester,
        ...data
      }))
      .sort((a, b) => a.semester.localeCompare(b.semester));

    // Properties by status
    const propertiesByStatus = {
      active: activeProperties,
      suspended: suspendedProperties,
      inactive: inactiveProperties
    };

    // Incidents by month
    const monthMap = new Map<string, { reported: number; resolved: number }>();
    
    incidents.forEach(incident => {
      const date = new Date(incident.dateReported);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(monthKey) || { reported: 0, resolved: 0 };
      existing.reported++;
      if (incident.dateResolved) {
        existing.resolved++;
      }
      monthMap.set(monthKey, existing);
    });

    const incidentsByMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    return {
      kpis: {
        totalProperties,
        activeProperties,
        suspendedProperties,
        inactiveProperties,
        currentSemesterRevenue,
        openIncidents,
        latePayments,
        paymentRate: Math.round(paymentRate * 10) / 10
      },
      paymentsBySemester,
      propertiesByStatus,
      incidentsByMonth
    };
  }
}
