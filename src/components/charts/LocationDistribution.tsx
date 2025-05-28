import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { dashboardService, type LocationDistributionData as ServiceLocationData } from '@/services/dashboard';
import { formatCurrency } from '@/lib/utils';
import { useEnhancedFilters } from '@/contexts/EnhancedFilterContext';

interface LocationDistributionProps {
  startDate: string;
  endDate: string;
  filters?: {
    categories?: string[];
    brands?: string[];
    genders?: string[];
    ageGroups?: string[];
  };
}

export function LocationDistribution({ startDate, endDate, filters }: LocationDistributionProps) {
  const [data, setData] = useState<ServiceLocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setFilters } = useEnhancedFilters();

  useEffect(() => {
    setLoading(true);
    dashboardService
      .getLocationDistribution(startDate, endDate, filters)
      .then(setData)
      .catch((error) => {
        console.error('Error fetching location distribution:', error);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate, filters]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload?.[[0]]) {
      const location = data.activePayload?.[[0]].payload.location_name;
      
      // Update the global filters with the selected location
      // Note: We'll need to add location/province to the filter types
      setFilters(prev => ({
        ...prev,
        // For now, navigate without setting location filter
        // TODO: Add location filter support
      }));
      
      // Navigate to the Consumer Insights page
      navigate('/consumer-insights');
    }
  };

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
          <div className="text-muted-foreground">No location data available</div>
          <div className="text-xs text-muted-foreground">
            Try adjusting the date range or check if location data exists
          </div>
        </div>
      </div>
    );
  }

  // Sort by customer count and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.customer_count - a.customer_count)
    .slice(0, 10);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 10, right: 20, left: 60, bottom: 60 }}
          onClick={handleBarClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="location_name" 
            fontSize={11}
            tick={{ fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            allowDecimals={false} 
            fontSize={12}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'customer_count') return [`${value} customers`, 'Customers'];
              if (name === 'transaction_count') return [`${value} transactions`, 'Transactions'];
              if (name === 'total_revenue') return [formatCurrency(value), 'Revenue'];
              return [value, name];
            }}
            labelFormatter={(label) => `Location: ${label}`}
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
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}