
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
import { useGlobalFilters } from '@/contexts/FilterContext';
import { formatDateForQuery } from '@/types/filters';

interface AgeDistributionProps {
  bucketSize?: number;
}

export function AgeDistribution({ bucketSize = 10 }: AgeDistributionProps) {
  const [data, setData] = useState<AgeDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { globalFilters } = useGlobalFilters();

  useEffect(() => {
    setLoading(true);
    console.log('🔍 AgeDistribution: Fetching data...', { 
      startDate: formatDateForQuery(globalFilters.startDate), 
      endDate: formatDateForQuery(globalFilters.endDate), 
      bucketSize, 
      filters: globalFilters 
    });
    
    dashboardService
      .getAgeDistribution(
        formatDateForQuery(globalFilters.startDate), 
        formatDateForQuery(globalFilters.endDate), 
        bucketSize, 
        {
          categories: globalFilters.categories,
          brands: globalFilters.brands,
          genders: globalFilters.genders,
          ageGroups: globalFilters.ageGroups
        }
      )
      .then((result) => {
        console.log('📊 AgeDistribution: Data received:', result);
        setData(result);
      })
      .catch((error) => {
        console.error('❌ AgeDistribution: Error fetching data:', error);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [globalFilters, bucketSize]);

  if (loading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-muted-foreground">No age distribution data available</div>
          <div className="text-xs text-muted-foreground">
            Try adjusting the date range or check if customer_age data exists
          </div>
        </div>
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
            name="Customers"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
