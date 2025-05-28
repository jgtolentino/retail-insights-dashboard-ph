import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportService, type ExportData } from '../exportService';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    internal: {
      pages: { length: 2 },
      pageSize: { width: 210, height: 297 },
    },
  };
  
  return {
    default: vi.fn(() => mockDoc),
  };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

// Mock xlsx
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({ '!cols': [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('ExportService', () => {
  const mockExportData: ExportData = {
    title: 'Test Report',
    headers: ['Name', 'Value', 'Date'],
    data: [
      ['Item 1', '100', '2024-01-01'],
      ['Item 2', '200', '2024-01-02'],
    ],
    metadata: {
      generatedAt: '2024-01-01T00:00:00Z',
      dateRange: { start: '2024-01-01', end: '2024-01-31' },
      filters: { category: 'electronics' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToCSV', () => {
    it('should generate CSV content with headers and data', () => {
      const { saveAs } = require('file-saver');
      
      exportService.exportToCSV(mockExportData);
      
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringContaining('Test_Report_')
      );
    });

    it('should handle data with special characters', () => {
      const dataWithCommas: ExportData = {
        ...mockExportData,
        data: [['Item, with comma', '100', '2024-01-01']],
      };
      
      exportService.exportToCSV(dataWithCommas);
      
      expect(require('file-saver').saveAs).toHaveBeenCalled();
    });
  });

  describe('exportToJSON', () => {
    it('should convert array data to JSON objects', () => {
      const { saveAs } = require('file-saver');
      
      exportService.exportToJSON(mockExportData);
      
      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringContaining('Test_Report_')
      );
    });
  });

  describe('exportToExcel', () => {
    it('should create workbook with data and metadata sheets', () => {
      const XLSX = require('xlsx');
      
      exportService.exportToExcel(mockExportData);
      
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });
  });

  describe('exportToPDF', () => {
    it('should create PDF with title and data table', () => {
      const jsPDF = require('jspdf').default;
      
      exportService.exportToPDF(mockExportData);
      
      expect(jsPDF).toHaveBeenCalled();
    });
  });

  describe('printView', () => {
    it('should open print window with formatted content', () => {
      const mockWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        close: vi.fn(),
      };

      vi.stubGlobal('window', {
        ...window,
        open: vi.fn(() => mockWindow),
      });

      exportService.printView('Test Print');

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockWindow.document.write).toHaveBeenCalled();
    });
  });
});