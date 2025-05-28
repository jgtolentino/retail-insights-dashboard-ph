
import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { dashboardService, type GenderDistributionData } from '@/services/dashboard';
import { formatCurrency } from '@/lib/utils';
import { useGlobalFilters } from '@/contexts/FilterContext';
import { formatDateForQuery } from '@/types/filters';

const GENDER_COLORS = {
  'Male': '#3b82f6',
  'Female': '#ec4899', 
  'Unknown': '#6b7280'
};

export function GenderDistribution() {
  const [data, setData] = useState<GenderDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { globalFilters } = useGlobalFilters();

  useEffect(() => {
    setLoading(true);
    dashboardService
      .getGenderDistribution(
        formatDateForQuery(globalFilters.startDate), 
        formatDateForQuery(globalFilters.endDate), 
        {
          categories: globalFilters.categories,
          brands: globalFilters.brands,
          ageGroups: globalFilters.ageGroups
        }
      )
      .then(setData)
      .finally(() => setLoading(false));
  }, [globalFilters]);

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
        No gender distribution data available for the selected period
      </div>
    );
  }

  const pieData = data.map(item => ({
    name: item.gender,
    value: item.customer_count,
    revenue: item.total_revenue
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            labelLine={false}
            label={({ name, percent }) => 
              percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
            }
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={GENDER_COLORS[entry.name as keyof typeof GENDER_COLORS] || '#6b7280'} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, entry: any) => [
              `${value} customers`,
              entry.payload.revenue ? formatCurrency(entry.payload.revenue) : 'Revenue'
            ]}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{
              paddingTop: '20px'
            }}
            iconType="rect"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
