// Service for PDF generation using jsPDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, Payment, Incident } from '../../types';

export class PdfService {
  /**
   * Generate PDF for properties list
   */
  static generatePropertiesPDF(properties: Property[], filters?: string): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(227, 0, 123); // UPB red
    doc.text('Listado de Predios', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);
    
    if (filters) {
      doc.text(`Filtros: ${filters}`, 14, 35);
    }
    
    // Table data
    const tableData = properties.map(prop => [
      prop.number,
      prop.ownerName,
      prop.status,
      prop.notes || ''
    ]);
    
    autoTable(doc, {
      head: [['Número', 'Propietario', 'Estado', 'Notas']],
      body: tableData,
      startY: filters ? 42 : 37,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [227, 0, 123],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`predios_${new Date().toISOString().split('T')[0]}.pdf`);
  }
  
  /**
   * Generate PDF for payments report
   */
  static generatePaymentsPDF(
    payments: Payment[],
    properties: Property[],
    filters?: string
  ): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(227, 0, 123);
    doc.text('Reporte de Pagos', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);
    
    if (filters) {
      doc.text(`Filtros: ${filters}`, 14, 35);
    }
    
    // Summary
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const paid = payments
      .filter(p => p.status === 'Pagado')
      .reduce((sum, p) => sum + p.amount, 0);
    
    doc.setFontSize(12);
    doc.text(`Total Recaudado: $${total.toLocaleString()}`, 14, filters ? 45 : 40);
    doc.text(`Pagado: $${paid.toLocaleString()}`, 14, filters ? 50 : 45);
    
    // Table data
    const getPropertyLabel = (id: string) => {
      const prop = properties.find(p => p.id === id);
      return prop ? `${prop.number} - ${prop.ownerName}` : 'Desconocido';
    };
    
    const tableData = payments.map(payment => [
      getPropertyLabel(payment.propertyId),
      payment.semester,
      payment.date,
      `$${payment.amount.toLocaleString()}`,
      payment.status
    ]);
    
    autoTable(doc, {
      head: [['Predio', 'Semestre', 'Fecha', 'Monto', 'Estado']],
      body: tableData,
      startY: filters ? 58 : 53,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [227, 0, 123],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        3: { halign: 'right' }
      }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`pagos_${new Date().toISOString().split('T')[0]}.pdf`);
  }
  
  /**
   * Generate PDF for incidents report
   */
  static generateIncidentsPDF(incidents: Incident[], filters?: string): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(227, 0, 123);
    doc.text('Reporte de Incidencias', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);
    
    if (filters) {
      doc.text(`Filtros: ${filters}`, 14, 35);
    }
    
    // Summary
    const open = incidents.filter(i => i.status === 'Abierta').length;
    const resolved = incidents.filter(i => i.status === 'Resuelta').length;
    const inProgress = incidents.filter(i => i.status === 'En Proceso').length;
    
    doc.setFontSize(12);
    doc.text(`Total: ${incidents.length}`, 14, filters ? 45 : 40);
    doc.text(`Abiertas: ${open} | En Proceso: ${inProgress} | Resueltas: ${resolved}`, 14, filters ? 50 : 45);
    
    // Table data
    const tableData = incidents.map(inc => [
      inc.dateReported,
      inc.description.substring(0, 50) + (inc.description.length > 50 ? '...' : ''),
      inc.status,
      inc.dateResolved || 'Pendiente'
    ]);
    
    autoTable(doc, {
      head: [['Fecha Reporte', 'Descripción', 'Estado', 'Fecha Resolución']],
      body: tableData,
      startY: filters ? 58 : 53,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [227, 0, 123],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        1: { cellWidth: 80 }
      }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`incidencias_${new Date().toISOString().split('T')[0]}.pdf`);
  }
  
  /**
   * Generate PDF for dashboard report
   */
  static generateDashboardPDF(
    properties: Property[],
    payments: Payment[],
    incidents: Incident[]
  ): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(227, 0, 123);
    doc.text('Reporte General - Dashboard', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 30);
    
    // KPIs
    doc.setFontSize(14);
    doc.text('Indicadores Principales', 14, 45);
    
    doc.setFontSize(11);
    doc.text(`Total Predios: ${properties.length}`, 14, 55);
    doc.text(`Predios Activos: ${properties.filter(p => p.status === 'Activo').length}`, 14, 62);
    
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;
    const currentSemester = `${year}-${semester}`;
    const currentPayments = payments.filter(p => p.semester === currentSemester);
    const revenue = currentPayments
      .filter(p => p.status === 'Pagado')
      .reduce((sum, p) => sum + p.amount, 0);
    
    doc.text(`Recaudo ${currentSemester}: $${revenue.toLocaleString()}`, 14, 69);
    doc.text(`Incidencias Abiertas: ${incidents.filter(i => i.status === 'Abierta').length}`, 14, 76);
    
    // Summary tables
    doc.setFontSize(14);
    doc.text('Resumen de Pagos', 14, 90);
    
    const paymentSummary = [
      ['Semestre', 'Total', 'Pagado', 'Pendiente', 'En Mora']
    ];
    
    const semesterMap = new Map<string, { total: number; paid: number; pending: number; late: number }>();
    payments.forEach(p => {
      const existing = semesterMap.get(p.semester) || { total: 0, paid: 0, pending: 0, late: 0 };
      existing.total += p.amount;
      if (p.status === 'Pagado') existing.paid += p.amount;
      else if (p.status === 'En Mora') existing.late += p.amount;
      else existing.pending += p.amount;
      semesterMap.set(p.semester, existing);
    });
    
    Array.from(semesterMap.entries()).forEach(([sem, data]) => {
      paymentSummary.push([
        sem,
        `$${data.total.toLocaleString()}`,
        `$${data.paid.toLocaleString()}`,
        `$${data.pending.toLocaleString()}`,
        `$${data.late.toLocaleString()}`
      ]);
    });
    
    autoTable(doc, {
      head: [paymentSummary[0]],
      body: paymentSummary.slice(1),
      startY: 95,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [227, 0, 123],
        textColor: 255,
        fontStyle: 'bold'
      }
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
