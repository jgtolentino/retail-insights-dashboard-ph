import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Brand {
  id: number;
  name: string;
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('brands')
        .select('name')
        .neq('name', null)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      // Deduplicate and filter out null/empty values
      const uniqueBrands = [...new Set(data?.map(b => b.name).filter(Boolean))];
      return uniqueBrands;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useAllBrands() {
  return useQuery({
    queryKey: ['brands-detailed'],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .neq('name', null)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
