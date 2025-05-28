import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportData {
  title: string;
  headers: string[];
  data: any[][];
  metadata?: {
    generatedAt: string;
    filters?: Record<string, any>;
    dateRange?: { start: string; end: string };
  };
}

export interface ChartData {
  title: string;
  chartElement: HTMLElement;
  data: any[];
}

class ExportService {
  /**
   * Export data to CSV format
   */
  exportToCSV(exportData: ExportData): void {
    const { title, headers, data, metadata } = exportData;
    
    let csvContent = '';
    
    // Add metadata if provided
    if (metadata) {
      csvContent += `# ${title}\n`;
      csvContent += `# Generated: ${metadata.generatedAt}\n`;
      if (metadata.dateRange) {
        csvContent += `# Date Range: ${metadata.dateRange.start} to ${metadata.dateRange.end}\n`;
      }
      csvContent += '\n';
    }
    
    // Add headers
    csvContent += headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
      const escapedRow = row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvContent += escapedRow.join(',') + '\n';
    });
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  }

  /**
   * Export data to Excel format
   */
  exportToExcel(exportData: ExportData): void {
    const { title, headers, data, metadata } = exportData;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create metadata sheet if provided
    if (metadata) {
      const metadataRows = [
        ['Report Title', title],
        ['Generated At', metadata.generatedAt],
        ...(metadata.dateRange ? [
          ['Date Range Start', metadata.dateRange.start],
          ['Date Range End', metadata.dateRange.end]
        ] : []),
        ...(metadata.filters ? Object.entries(metadata.filters).map(([key, value]) => [
          `Filter: ${key}`, Array.isArray(value) ? value.join(', ') : String(value)
        ]) : [])
      ];
      
      const metadataWS = XLSX.utils.aoa_to_sheet(metadataRows);
      XLSX.utils.book_append_sheet(wb, metadataWS, 'Metadata');
    }
    
    // Create data sheet
    const wsData = [headers, ...data];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-size columns
    const colWidths = headers.map((header, i) => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[i] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Download file
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Export data to PDF format
   */
  exportToPDF(exportData: ExportData, includeCharts?: ChartData[]): void {
    const { title, headers, data, metadata } = exportData;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 20);
    
    let yPosition = 35;
    
    // Add metadata
    if (metadata) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${metadata.generatedAt}`, 20, yPosition);
      yPosition += 7;
      
      if (metadata.dateRange) {
        doc.text(`Date Range: ${metadata.dateRange.start} to ${metadata.dateRange.end}`, 20, yPosition);
        yPosition += 7;
      }
      
      if (metadata.filters && Object.keys(metadata.filters).length > 0) {
        doc.text('Applied Filters:', 20, yPosition);
        yPosition += 5;
        Object.entries(metadata.filters).forEach(([key, value]) => {
          const filterText = `  ${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`;
          doc.text(filterText, 25, yPosition);
          yPosition += 5;
        });
      }
      
      yPosition += 10;
    }
    
    // Add charts if provided
    if (includeCharts && includeCharts.length > 0) {
      for (const chartData of includeCharts) {
        try {
          const canvas = chartData.chartElement.querySelector('canvas');
          if (canvas) {
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 20, yPosition, 170, 100);
            yPosition += 110;
            
            // Add new page if needed
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
          }
        } catch (error) {
          console.warn('Could not export chart:', error);
        }
      }
    }
    
    // Add data table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        // Auto-adjust column widths based on content
      },
      didDrawPage: (data) => {
        // Add page numbers
        const pageCount = doc.internal.pages.length - 1;
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width - 40,
          doc.internal.pageSize.height - 10
        );
      },
    });
    
    // Download file
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Export data to JSON format
   */
  exportToJSON(exportData: ExportData): void {
    const { title, headers, data, metadata } = exportData;
    
    // Convert array data to objects
    const jsonData = data.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    const exportObject = {
      title,
      metadata: {
        ...metadata,
        exportedAt: new Date().toISOString(),
        recordCount: data.length,
      },
      data: jsonData,
    };
    
    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
  }

  /**
   * Print current view
   */
  printView(title: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .content { margin: 20px 0; }
            @media print {
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">
            ${document.querySelector('.dashboard-content')?.innerHTML || document.body.innerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
}

export const exportService = new ExportService();