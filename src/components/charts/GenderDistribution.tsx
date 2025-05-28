import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilters } from '@/contexts/FilterContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function GenderDistribution() {
  const { filters } = useFilters();

  const { data: genderData, isLoading, error } = useQuery({
    queryKey: ['gender-distribution', filters.dateRange.start, filters.dateRange.end],
    queryFn: async () => {
      // Convert string dates to Date objects for the RPC call
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      const { data, error } = await supabase.rpc('get_gender_distribution', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading gender distribution...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading gender distribution: {error.message}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={genderData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {genderData?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
