import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { dashboardService, type AgeDistributionData } from '@/services/dashboard';

interface AgeDistributionProps {
  startDate: string;
  endDate: string;
  bucketSize?: number;
}

export function AgeDistribution({ startDate, endDate, bucketSize = 10 }: AgeDistributionProps) {
  const [data, setData] = useState<AgeDistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardService
      .getAgeDistribution(startDate, endDate, bucketSize)
      .then(setData)
      .finally(() => setLoading(false));
  }, [startDate, endDate, bucketSize]);

  if (loading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        No age distribution data available for the selected period
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="age_bucket" 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            allowDecimals={false} 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} customers`, 'Count']}
            labelFormatter={(label) => `Age Group: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Bar 
            dataKey="customer_count" 
            fill="#3b82f6" 
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}