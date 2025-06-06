import React, { useState, useMemo } from 'react';
import { X, Download, Filter, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface DrillDownData {
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
  data: Record<string, any>[];
  chartConfig?: {
    type: 'table' | 'chart';
    columns: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'currency' | 'percentage' | 'date';
      sortable?: boolean;
    }>;
  };
}

export interface DrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrillDownData | null;
  onExport?: (format: 'csv' | 'excel' | 'png') => void;
}

export function DrillModal({ isOpen, onClose, data, onExport }: DrillModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('table');

  const columns = data?.chartConfig?.columns || [];
  
  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data?.data) return [];
    
    let filtered = data.data;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [data?.data, searchTerm, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatCellValue = (value: any, type: string) => {
    if (value == null) return '-';
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0
        }).format(Number(value));
      
      case 'number':
        return new Intl.NumberFormat('en-PH').format(Number(value));
      
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      default:
        return String(value);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'png') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default CSV export
      if (format === 'csv') {
        const headers = columns.map(col => col.label).join(',');
        const rows = processedData.map(row => 
          columns.map(col => row[col.key]).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data?.title || 'data'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {data.title}
              </DialogTitle>
              {data.subtitle && (
                <p className="text-sm text-gray-600 mt-1">{data.subtitle}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Metadata */}
          {data.metadata && (
            <div className="flex items-center space-x-4 mt-3">
              {Object.entries(data.metadata).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between space-x-4 py-3 border-b">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="25">25 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {processedData.length} total records
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          className={column.sortable !== false ? 'cursor-pointer hover:bg-gray-50' : ''}
                          onClick={() => column.sortable !== false && handleSort(column.key)}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.label}</span>
                            {sortConfig?.key === column.key && (
                              <span className="text-xs">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {formatCellValue(row[column.key], column.type)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {paginatedData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No data matches your search criteria
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="summary" className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                {/* Summary statistics */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Records</div>
                  <div className="text-2xl font-bold">{processedData.length}</div>
                </div>
                
                {/* Add more summary metrics based on data type */}
                {columns.filter(col => col.type === 'currency' || col.type === 'number').map(column => {
                  const values = processedData.map(row => Number(row[column.key]) || 0);
                  const sum = values.reduce((a, b) => a + b, 0);
                  const avg = sum / values.length || 0;
                  
                  return (
                    <div key={column.key} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">{column.label} (Avg)</div>
                      <div className="text-2xl font-bold">
                        {formatCellValue(avg, column.type)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-3 border-t">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}