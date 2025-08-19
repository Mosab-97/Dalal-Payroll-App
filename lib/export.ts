import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate, formatMonth } from './utils';

export function exportToPDF(data: any[], columns: any[], title: string, filename: string) {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.setTextColor(11, 11, 12); // Charcoal color
  doc.text('Dalal', 20, 20);
  
  doc.setFontSize(14);
  doc.text(title, 20, 35);
  
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 45);
  
  // Add table
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
      const value = row[col.accessor];
      if (col.cell) {
        return col.cell({ getValue: () => value });
      }
      return value;
    })),
    startY: 55,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [11, 11, 12],
      textColor: [248, 249, 251],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 251],
    },
  });
  
  doc.save(filename);
}

export function exportToExcel(data: any[], columns: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => {
      const newRow: any = {};
      columns.forEach(col => {
        const value = row[col.accessor];
        if (col.cell) {
          newRow[col.header] = col.cell({ getValue: () => value });
        } else {
          newRow[col.header] = value;
        }
      });
      return newRow;
    })
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  XLSX.writeFile(workbook, filename);
}

export function generateStatementPDF(statement: any, project: any, attachments: any[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(11, 11, 12);
  doc.text('Dalal', 20, 25);
  
  doc.setFontSize(16);
  doc.text('Monthly Statement', 20, 40);
  
  doc.setFontSize(12);
  doc.text(`Project: ${project.name}`, 20, 55);
  doc.text(`Month: ${formatMonth(statement.month)}`, 20, 70);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 20, 85);
  
  // Financial Summary
  const summaryData = [
    ['Total Payroll', formatCurrency(statement.total_payroll)],
    ['Total Expenses', formatCurrency(statement.total_expenses)],
    ['Total Advances', formatCurrency(statement.total_advances)],
    ['Remaining Budget', formatCurrency(statement.remaining_budget)],
  ];
  
  autoTable(doc, {
    body: summaryData,
    startY: 100,
    theme: 'plain',
    styles: {
      fontSize: 12,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
    },
  });
  
  // Attachments section
  if (attachments.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Attachments', 20, 30);
    
    const attachmentData = attachments.map((att, index) => [
      index + 1,
      att.name,
      att.type,
      `${(att.size / 1024).toFixed(2)} KB`,
      att.url
    ]);
    
    autoTable(doc, {
      head: [['#', 'File Name', 'Type', 'Size', 'URL']],
      body: attachmentData,
      startY: 45,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [11, 11, 12],
        textColor: [248, 249, 251],
      },
    });
  }
  
  doc.save(`statement_${project.name}_${formatMonth(statement.month)}.pdf`);
}