import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilters } from '@/contexts/FilterContext';

export function AgeDistribution() {
  const { filters } = useFilters();

  const { data: ageData, isLoading, error } = useQuery({
    queryKey: ['age-distribution', filters.dateRange.start, filters.dateRange.end],
    queryFn: async () => {
      // Convert string dates to Date objects for the RPC call
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      const { data, error } = await supabase.rpc('get_age_distribution', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        bucket_size: 10
      });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading age distribution...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading age distribution: {error.message}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={ageData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="age_bucket" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="customer_count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
