import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardSummary {
  totalRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  uniqueCustomers: number;
  revenueGrowth: number;
  transactionGrowth: number;
  customerGrowth: number;
  avgValueGrowth: number;
}

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransactionValue: 0,
    uniqueCustomers: 0,
    revenueGrowth: 0,
    transactionGrowth: 0,
    customerGrowth: 0,
    avgValueGrowth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardSummary() {
      try {
        setIsLoading(true);
        setError(null);

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Get previous month for growth calculation
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        // Fetch current month summary data
        const { data: currentData, error: currentError } = await supabase
          .from('transactions')
          .select(
            `
            id,
            total_amount,
            customer_id,
            created_at
          `
          )
          .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
          .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

        if (currentError) throw currentError;

        // Fetch previous month data for growth calculation
        const { data: prevData, error: prevError } = await supabase
          .from('transactions')
          .select(
            `
            id,
            total_amount,
            customer_id,
            created_at
          `
          )
          .gte('created_at', `${prevYear}-${prevMonth.toString().padStart(2, '0')}-01`)
          .lt('created_at', `${prevYear}-${currentMonth.toString().padStart(2, '0')}-01`);

        if (prevError) throw prevError;

        // Calculate current month metrics
        const totalRevenue =
          currentData?.reduce((sum, transaction) => sum + (transaction.total_amount || 0), 0) || 0;
        const totalTransactions = currentData?.length || 0;
        const uniqueCustomers = new Set(currentData?.map(t => t.customer_id)).size;
        const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        // Calculate previous month metrics
        const prevRevenue =
          prevData?.reduce((sum, transaction) => sum + (transaction.total_amount || 0), 0) || 0;
        const prevTransactions = prevData?.length || 0;
        const prevCustomers = new Set(prevData?.map(t => t.customer_id)).size;
        const prevAvgValue = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;

        // Calculate growth rates
        const revenueGrowth =
          prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const transactionGrowth =
          prevTransactions > 0
            ? ((totalTransactions - prevTransactions) / prevTransactions) * 100
            : 0;
        const customerGrowth =
          prevCustomers > 0 ? ((uniqueCustomers - prevCustomers) / prevCustomers) * 100 : 0;
        const avgValueGrowth =
          prevAvgValue > 0 ? ((avgTransactionValue - prevAvgValue) / prevAvgValue) * 100 : 0;

        setSummary({
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalTransactions,
          avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
          uniqueCustomers,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          transactionGrowth: Math.round(transactionGrowth * 10) / 10,
          customerGrowth: Math.round(customerGrowth * 10) / 10,
          avgValueGrowth: Math.round(avgValueGrowth * 10) / 10,
        });
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');

        // Fallback to zero values on error
        setSummary({
          totalRevenue: 0,
          totalTransactions: 0,
          avgTransactionValue: 0,
          uniqueCustomers: 0,
          revenueGrowth: 0,
          transactionGrowth: 0,
          customerGrowth: 0,
          avgValueGrowth: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardSummary();
  }, []);

  return { summary, isLoading, error };
}
