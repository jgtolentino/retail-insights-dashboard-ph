import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportData {
  headers: string[];
  rows: any[][];
  title?: string;
  metadata?: Record<string, string>;
}

// CSV Export
export function exportToCSV(data: ExportData, filename: string) {
  const { headers, rows } = data;

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          // Escape commas and quotes
          const cellStr = String(cell || '');
          return cellStr.includes(',') || cellStr.includes('"')
            ? `"${cellStr.replace(/"/g, '""')}"`
            : cellStr;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Excel Export
export function exportToExcel(data: ExportData, filename: string) {
  const { headers, rows, title, metadata } = data;

  // Create workbook
  const wb = utils.book_new();

  // Create worksheet data
  const wsData = [];

  // Add title if provided
  if (title) {
    wsData.push([title]);
    wsData.push([]); // Empty row
  }

  // Add metadata if provided
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      wsData.push([key, value]);
    });
    wsData.push([]); // Empty row
  }

  // Add headers and data
  wsData.push(headers);
  wsData.push(...rows);

  // Create worksheet
  const ws = utils.aoa_to_sheet(wsData);

  // Add worksheet to workbook
  utils.book_append_sheet(wb, ws, 'Data');

  // Write file
  writeFile(wb, `${filename}.xlsx`);
}

// PDF Export
export function exportToPDF(data: ExportData, filename: string) {
  const { headers, rows, title, metadata } = data;

  // Create PDF document
  const doc = new jsPDF();

  // Add title
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  // Add metadata
  let yPosition = title ? 35 : 20;
  if (metadata) {
    doc.setFontSize(10);
    Object.entries(metadata).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Add table
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: yPosition,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Light gray
    },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
}

// Helper function to format dashboard data for export
export function formatDashboardDataForExport(data: any, timeRange: string): ExportData {
  const metadata = {
    Generated: new Date().toLocaleString(),
    'Time Range': timeRange,
    'Total Revenue': formatCurrency(data.totalRevenue),
    'Total Transactions': data.totalTransactions.toString(),
    'Average Transaction': formatCurrency(data.avgTransaction),
  };

  const headers = ['Brand', 'Revenue', 'Percentage'];
  const rows = data.topBrands.map((brand: any) => [
    brand.name,
    formatCurrency(brand.sales),
    `${((brand.sales / data.totalRevenue) * 100).toFixed(1)}%`,
  ]);

  return {
    headers,
    rows,
    title: 'Dashboard Report',
    metadata,
  };
}

// Helper function to format time series data for export
export function formatTimeSeriesDataForExport(data: any[], timeRange: string): ExportData {
  const headers = ['Date', 'Transactions', 'Revenue'];
  const rows = data.map(item => [item.date, item.transactions, formatCurrency(item.revenue)]);

  return {
    headers,
    rows,
    title: 'Transaction Trends',
    metadata: {
      Generated: new Date().toLocaleString(),
      'Time Range': timeRange,
      'Total Records': data.length.toString(),
    },
  };
}

// Helper function to format product mix data for export
export function formatProductMixDataForExport(data: any[], type: string): ExportData {
  let headers: string[];
  let rows: any[][];

  switch (type) {
    case 'substitutions':
      headers = ['Original Product', 'Substitute Product', 'Count', 'Reason', 'Revenue Impact'];
      rows = data.map(item => [
        item.original_product,
        item.substitute_product,
        item.count,
        item.reasons,
        formatCurrency(item.revenue_impact),
      ]);
      break;
    case 'categories':
      headers = ['Category', 'Units Sold', 'Revenue'];
      rows = data.map(item => [item.category, item.units, formatCurrency(item.revenue)]);
      break;
    default:
      headers = ['Item', 'Value'];
      rows = data.map(item => [item.name || 'Unknown', item.value || 0]);
  }

  return {
    headers,
    rows,
    title: `Product Mix - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    metadata: {
      Generated: new Date().toLocaleString(),
      'Total Records': data.length.toString(),
    },
  };
}
