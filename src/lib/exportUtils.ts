import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  filename?: string;
  format: 'csv' | 'excel' | 'png' | 'pdf';
  data?: any[];
  columns?: Array<{
    key: string;
    label: string;
    type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  }>;
  elementId?: string;
  title?: string;
}

export class ExportUtils {
  /**
   * Export data to CSV format
   */
  static exportToCSV(data: any[], columns: ExportOptions['columns'], filename = 'export.csv') {
    if (!data.length || !columns?.length) return;

    // Create headers
    const headers = columns.map(col => col.label).join(',');
    
    // Create rows
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create and download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export data to Excel format (XLSX)
   */
  static async exportToExcel(data: any[], columns: ExportOptions['columns'], filename = 'export.xlsx') {
    try {
      // Dynamic import for xlsx to reduce bundle size
      const XLSX = await import('xlsx');
      
      if (!data.length || !columns?.length) return;

      // Create worksheet data
      const worksheetData = [
        columns.map(col => col.label), // Headers
        ...data.map(row => columns.map(col => row[col.key])) // Data rows
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Auto-size columns
      const colWidths = columns.map(col => ({ wch: Math.max(col.label.length, 15) }));
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Write and download file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Excel export failed:', error);
      // Fallback to CSV
      this.exportToCSV(data, columns, filename.replace('.xlsx', '.csv'));
    }
  }

  /**
   * Export DOM element as PNG image
   */
  static async exportToPNG(elementId: string, filename = 'export.png', options?: {
    backgroundColor?: string;
    scale?: number;
    width?: number;
    height?: number;
  }) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      const canvas = await html2canvas(element, {
        backgroundColor: options?.backgroundColor || '#ffffff',
        scale: options?.scale || 2,
        useCORS: true,
        allowTaint: true,
        width: options?.width,
        height: options?.height,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('PNG export failed:', error);
      throw error;
    }
  }

  /**
   * Export multiple charts or entire dashboard as PDF
   */
  static async exportToPDF(
    elements: Array<{ id: string; title?: string }>, 
    filename = 'dashboard.pdf',
    options?: {
      orientation?: 'portrait' | 'landscape';
      format?: 'a4' | 'letter';
      margin?: number;
    }
  ) {
    try {
      const pdf = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'a4',
        unit: 'mm'
      });

      const margin = options?.margin || 10;
      const pageWidth = pdf.internal.pageSize.getWidth() - (margin * 2);
      const pageHeight = pdf.internal.pageSize.getHeight() - (margin * 2);

      for (let i = 0; i < elements.length; i++) {
        const { id, title } = elements[i];
        const element = document.getElementById(id);
        
        if (!element) {
          console.warn(`Element with id "${id}" not found, skipping`);
          continue;
        }

        // Add new page if not first element
        if (i > 0) {
          pdf.addPage();
        }

        // Add title if provided
        if (title) {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(title, margin, margin + 10);
        }

        // Capture element as image
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 1,
          useCORS: true,
        });

        // Calculate dimensions to fit page
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pageWidth / imgWidth, (pageHeight - (title ? 20 : 0)) / imgHeight);
        
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;

        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(
          imgData, 
          'PNG', 
          margin, 
          margin + (title ? 15 : 0), 
          finalWidth, 
          finalHeight
        );
      }

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  }

  /**
   * Main export function that handles all formats
   */
  static async export(options: ExportOptions) {
    const {
      format,
      filename = `export_${new Date().toISOString().split('T')[0]}`,
      data,
      columns,
      elementId,
      title
    } = options;

    try {
      switch (format) {
        case 'csv':
          if (!data || !columns) throw new Error('Data and columns required for CSV export');
          this.exportToCSV(data, columns, `${filename}.csv`);
          break;

        case 'excel':
          if (!data || !columns) throw new Error('Data and columns required for Excel export');
          await this.exportToExcel(data, columns, `${filename}.xlsx`);
          break;

        case 'png':
          if (!elementId) throw new Error('Element ID required for PNG export');
          await this.exportToPNG(elementId, `${filename}.png`);
          break;

        case 'pdf':
          if (!elementId) throw new Error('Element ID required for PDF export');
          await this.exportToPDF([{ id: elementId, title }], `${filename}.pdf`);
          break;

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Export failed (${format}):`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Format data for export based on column types
   */
  static formatDataForExport(data: any[], columns: ExportOptions['columns']) {
    if (!columns) return data;

    return data.map(row => {
      const formattedRow: any = {};
      
      columns.forEach(col => {
        const value = row[col.key];
        
        switch (col.type) {
          case 'currency':
            formattedRow[col.key] = typeof value === 'number' 
              ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
              : value;
            break;
            
          case 'percentage':
            formattedRow[col.key] = typeof value === 'number' 
              ? `${value.toFixed(1)}%` 
              : value;
            break;
            
          case 'date':
            formattedRow[col.key] = value instanceof Date 
              ? value.toLocaleDateString() 
              : value;
            break;
            
          case 'number':
            formattedRow[col.key] = typeof value === 'number' 
              ? new Intl.NumberFormat('en-PH').format(value)
              : value;
            break;
            
          default:
            formattedRow[col.key] = value;
        }
      });
      
      return formattedRow;
    });
  }
}

// Hook for easy export functionality in components
export function useExport() {
  const exportData = async (options: ExportOptions) => {
    return ExportUtils.export(options);
  };

  const exportChart = async (elementId: string, format: 'png' | 'pdf' = 'png', filename?: string) => {
    return ExportUtils.export({
      format,
      elementId,
      filename: filename || `chart_${new Date().toISOString().split('T')[0]}`
    });
  };

  const exportTableData = async (
    data: any[], 
    columns: ExportOptions['columns'], 
    format: 'csv' | 'excel' = 'csv',
    filename?: string
  ) => {
    return ExportUtils.export({
      format,
      data: ExportUtils.formatDataForExport(data, columns),
      columns,
      filename: filename || `data_${new Date().toISOString().split('T')[0]}`
    });
  };

  return {
    exportData,
    exportChart,
    exportTableData
  };
}