import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  FileText,
  Loader2 
} from 'lucide-react';
import { useFilteredTransactions } from '@/hooks/useFilteredTransactions';

interface TransactionsTableProps {
  className?: string;
  initialPageSize?: number;
}

function TransactionsTableComponent({ 
  className = '',
  initialPageSize = 10
}: TransactionsTableProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(initialPageSize);

  const { data, isLoading, error, isError } = useFilteredTransactions({
    pageNumber,
    pageSize,
  });

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFirstPage = () => setPageNumber(1);
  const handlePreviousPage = () => setPageNumber(Math.max(1, pageNumber - 1));
  const handleNextPage = () => setPageNumber(Math.min(data?.totalPages || 1, pageNumber + 1));
  const handleLastPage = () => setPageNumber(data?.totalPages || 1);

  if (isError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-500">
            Error loading transactions: {error?.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Transactions
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          
          {data && (
            <div className="text-sm text-gray-600">
              Showing {((pageNumber - 1) * pageSize) + 1} to{' '}
              {Math.min(pageNumber * pageSize, data.totalCount)} of{' '}
              {data.totalCount} transactions
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No transactions found for current filter selection
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        #{transaction.id}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        {transaction.store?.name || 'Unknown Store'}
                      </TableCell>
                      <TableCell>
                        {transaction.store?.city && transaction.store?.region
                          ? `${transaction.store.city}, ${transaction.store.region}`
                          : 'Unknown Location'
                        }
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {pageNumber} of {data.totalPages}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFirstPage}
                    disabled={pageNumber === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={pageNumber === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={pageNumber === data.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLastPage}
                    disabled={pageNumber === data.totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Transactions:</span>
                  <div className="font-semibold">{data.totalCount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Current Page:</span>
                  <div className="font-semibold">{pageNumber} of {data.totalPages}</div>
                </div>
                <div>
                  <span className="text-gray-600">Page Total:</span>
                  <div className="font-semibold">
                    {formatCurrency(
                      data.rows.reduce((sum, transaction) => sum + transaction.total_amount, 0)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Export memoized component
const TransactionsTable = React.memo(TransactionsTableComponent);
export default TransactionsTable;