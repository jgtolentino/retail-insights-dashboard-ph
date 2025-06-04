import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BundleData {
  product_1: string;
  product_2: string;
  frequency: number;
  confidence: number;
}

export function useBundleData(enabled: boolean = true) {
  return useQuery({
    queryKey: ['bundleData'],
    queryFn: async (): Promise<BundleData | null> => {
      const { data: items, error } = await supabase
        .from('transaction_items')
        .select(
          `
          transaction_id,
          products!inner(name)
        `
        )
        .order('transaction_id');

      if (error || !items || items.length === 0) {
        return null;
      }

      // Group items by transaction
      const transactionGroups = items.reduce((acc: Record<number, string[]>, item) => {
        if (!acc[item.transaction_id]) acc[item.transaction_id] = [];
        acc[item.transaction_id].push(item.products.name);
        return acc;
      }, {});

      // Find most common product pairs
      const bundleCounts: Record<string, number> = {};
      Object.values(transactionGroups).forEach(products => {
        if (products.length >= 2) {
          products.sort();
          for (let i = 0; i < products.length - 1; i++) {
            for (let j = i + 1; j < products.length; j++) {
              const bundle = `${products[i]} + ${products[j]}`;
              bundleCounts[bundle] = (bundleCounts[bundle] || 0) + 1;
            }
          }
        }
      });

      const topBundle = Object.entries(bundleCounts).sort(([, a], [, b]) => b - a)[0];

      if (topBundle) {
        const [product1, product2] = topBundle[0].split(' + ');
        return {
          product_1: product1,
          product_2: product2,
          frequency: topBundle[1],
          confidence: Math.round((topBundle[1] / Object.keys(transactionGroups).length) * 100),
        };
      }

      return null;
    },
    enabled,
    staleTime: Infinity, // Calculate only once
    cacheTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
