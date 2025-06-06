import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrandPerformance {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  marketShare: number;
  growth: number;
  isClient: boolean;
  category: string;
  avgTransactionValue: number;
}

export function useBrandPerformance() {
  const [brandData, setBrandData] = useState<BrandPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrandPerformance() {
      try {
        setIsLoading(true);
        setError(null);

        // Get current month data
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Get previous month for growth calculation
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        // Fetch brand performance data with real calculations
        const { data: currentMonthData, error: currentError } = await supabase
          .from('transactions')
          .select(
            `
            id,
            total_amount,
            created_at,
            transaction_items!inner (
              quantity,
              total_amount,
              products!inner (
                id,
                name,
                category,
                brands!inner (
                  id,
                  name,
                  category,
                  is_tbwa
                )
              )
            )
          `
          )
          .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
          .lt('created_at', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

        if (currentError) throw currentError;

        // Fetch previous month data for growth calculation
        const { data: prevMonthData, error: prevError } = await supabase
          .from('transactions')
          .select(
            `
            id,
            total_amount,
            created_at,
            transaction_items!inner (
              quantity,
              total_amount,
              products!inner (
                id,
                name,
                category,
                brands!inner (
                  id,
                  name,
                  category,
                  is_tbwa
                )
              )
            )
          `
          )
          .gte('created_at', `${prevYear}-${prevMonth.toString().padStart(2, '0')}-01`)
          .lt('created_at', `${prevYear}-${currentMonth.toString().padStart(2, '0')}-01`);

        if (prevError) throw prevError;

        // Process current month data
        const brandMetrics = new Map<
          string,
          {
            id: string;
            name: string;
            category: string;
            isClient: boolean;
            revenue: number;
            transactions: number;
            totalRevenue: number;
          }
        >();

        // Calculate total revenue for market share
        let totalRevenue = 0;

        currentMonthData?.forEach(transaction => {
          transaction.transaction_items?.forEach(item => {
            const brand = item.products?.brands;
            if (brand) {
              const brandId = brand.id;
              const itemRevenue = item.total_amount || 0;

              if (!brandMetrics.has(brandId)) {
                brandMetrics.set(brandId, {
                  id: brandId,
                  name: brand.name,
                  category: brand.category || 'Other',
                  isClient: brand.is_tbwa || false,
                  revenue: 0,
                  transactions: 0,
                  totalRevenue: 0,
                });
              }

              const metric = brandMetrics.get(brandId)!;
              metric.revenue += itemRevenue;
              metric.transactions += 1;
              totalRevenue += itemRevenue;
            }
          });
        });

        // Process previous month data for growth calculation
        const prevBrandMetrics = new Map<string, number>();

        prevMonthData?.forEach(transaction => {
          transaction.transaction_items?.forEach(item => {
            const brand = item.products?.brands;
            if (brand) {
              const brandId = brand.id;
              const itemRevenue = item.total_amount || 0;
              const currentRevenue = prevBrandMetrics.get(brandId) || 0;
              prevBrandMetrics.set(brandId, currentRevenue + itemRevenue);
            }
          });
        });

        // Convert to BrandPerformance array with calculations
        const brandPerformanceData: BrandPerformance[] = Array.from(brandMetrics.values())
          .map(brand => {
            const marketShare = totalRevenue > 0 ? (brand.revenue / totalRevenue) * 100 : 0;
            const avgTransactionValue =
              brand.transactions > 0 ? brand.revenue / brand.transactions : 0;

            // Calculate growth
            const prevRevenue = prevBrandMetrics.get(brand.id) || 0;
            const growth =
              prevRevenue > 0 ? ((brand.revenue - prevRevenue) / prevRevenue) * 100 : 0;

            return {
              id: brand.id,
              name: brand.name,
              revenue: brand.revenue,
              transactions: brand.transactions,
              marketShare: Math.round(marketShare * 10) / 10, // Round to 1 decimal
              growth: Math.round(growth * 10) / 10, // Round to 1 decimal
              isClient: brand.isClient,
              category: brand.category,
              avgTransactionValue: Math.round(avgTransactionValue * 100) / 100, // Round to 2 decimals
            };
          })
          .filter(brand => brand.transactions > 0) // Only include brands with transactions
          .sort((a, b) => b.revenue - a.revenue); // Sort by revenue descending

        setBrandData(brandPerformanceData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');

        // Fallback to empty array on error
        setBrandData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBrandPerformance();
  }, []);

  return { brandData, isLoading, error };
}
