import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TransactionCounterProps {
  currentCount: number;
  dateRange: string;
  isLoading?: boolean;
}

export function TransactionCounter({
  currentCount,
  dateRange,
  isLoading = false,
}: TransactionCounterProps) {
  const { data: totalCount = 0, isLoading: isTotalLoading } = useQuery({
    queryKey: ['totalTransactionCount'],
    queryFn: async () => {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || isTotalLoading) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">Loading transaction data...</span>
        </div>
      </div>
    );
  }

  const percentage = totalCount > 0 ? ((currentCount / totalCount) * 100).toFixed(1) : '0';
  const isFiltered = currentCount < totalCount;

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        isFiltered ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className={`font-medium ${isFiltered ? 'text-yellow-900' : 'text-green-900'}`}>
            {currentCount.toLocaleString()} transactions
          </span>
          <span className={`ml-1 ${isFiltered ? 'text-yellow-700' : 'text-green-700'}`}>
            ({percentage}% of {totalCount.toLocaleString()} total)
          </span>
        </div>
        <div className={`text-xs ${isFiltered ? 'text-yellow-600' : 'text-green-600'}`}>
          {dateRange === 'all' ? 'All Time' : dateRange.toUpperCase()} view
          {isFiltered && ' (filtered)'}
        </div>
      </div>
    </div>
  );
}
