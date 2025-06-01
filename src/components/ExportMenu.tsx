import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';

interface ExportMenuProps {
  data: any;
  filename: string;
  formatData: (data: any) => { headers: string[]; rows: any[][] };
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ExportMenu({
  data,
  filename,
  formatData,
  disabled = false,
  loading = false,
  variant = 'outline',
  size = 'sm',
  className,
}: ExportMenuProps) {
  const { hasPermission } = useUser();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const canExport = hasPermission('canExport');

  const handleExportCSV = async () => {
    if (!canExport) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to export data.',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    try {
      const { headers, rows } = formatData(data);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row =>
          row
            .map(cell => {
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
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Your data has been exported as CSV.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your data.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (!canExport) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to export data.',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    try {
      const { headers, rows } = formatData(data);

      // Convert to array of objects
      const jsonData = rows.map(row => {
        const obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      // Create blob and download
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Your data has been exported as JSON.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your data.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (!canExport) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to export data.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { headers, rows } = formatData(data);

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      // Build HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${filename}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  row => `
                <tr>
                  ${row.map(cell => `<td>${cell || ''}</td>`).join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();

      toast({
        title: 'Print Dialog Opened',
        description: 'Your data is ready to print.',
      });
    } catch (error) {
      toast({
        title: 'Print Failed',
        description: 'There was an error preparing your data for printing.',
        variant: 'destructive',
      });
    }
  };

  if (!canExport) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Download className="mr-2 h-4 w-4" />
        Export (No Permission)
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || loading || exporting}
          className={className}
        >
          <Download className="mr-2 h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV} disabled={exporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON} disabled={exporting}>
          <File className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint} disabled={exporting}>
          <FileText className="mr-2 h-4 w-4" />
          Print Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
