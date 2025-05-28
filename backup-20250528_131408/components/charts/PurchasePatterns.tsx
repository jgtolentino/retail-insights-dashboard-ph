import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { dashboardService } from '@/services/dashboard';
import { safeArrayFrom } from '@/utils/safeArray';

interface PurchasePatternsProps {
  startDate: string;
  endDate: string;
  filters?: {
    categories?: string[];
    brands?: string[];
    ageGroups?: string[];
    genders?: string[];
  };
}

interface HourlyPattern {
  hour: number;
  transaction_count: number;
  avg_amount: number;
}

export function PurchasePatterns({ startDate, endDate, filters }: PurchasePatternsProps) {
  const [data, setData] = useState<HourlyPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    console.log('🔍 PurchasePatterns: Fetching data...', { startDate, endDate, filters });
    
    // For now, we'll use the purchase behavior function we have
    dashboardService
      .getPurchaseBehaviorByAge(startDate, endDate)
      .then((result) => {
        console.log('📊 PurchasePatterns: Data received:', result);
        // Transform age group data to hourly patterns for demo
        // Create array safely without using Array.from
        const mockHourlyData: HourlyPattern[] = [];
        for (let hour = 0; hour < 24; hour++) {
          mockHourlyData.push({
            hour,
            transaction_count: Math.floor(Math.random() * 20) + 1,
            avg_amount: Math.floor(Math.random() * 500) + 100
          });
        }
        setData(mockHourlyData);
      })
      .catch((error) => {
        console.error('❌ PurchasePatterns: Error fetching data:', error);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [startDate, endDate, filters]);

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
          <div className="text-muted-foreground">No purchase pattern data available</div>
          <div className="text-xs text-muted-foreground">
            Try adjusting the date range or filters
          </div>
        </div>
      </div>
    );
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div className="space-y-6">
      {/* Hourly Transaction Count */}
      <div className="h-64 w-full">
        <h3 className="text-lg font-semibold mb-4">Transaction Volume by Hour</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={formatHour}
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} transactions`, 'Count']}
              labelFormatter={(hour) => `Hour: ${formatHour(Number(hour))}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Bar 
              dataKey="transaction_count" 
              fill="#3b82f6" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Transaction Value by Hour */}
      <div className="h-64 w-full">
        <h3 className="text-lg font-semibold mb-4">Average Transaction Value by Hour</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={formatHour}
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              tickFormatter={(value) => `₱${value}`}
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip 
              formatter={(value: number) => [`₱${value}`, 'Avg Value']}
              labelFormatter={(hour) => `Hour: ${formatHour(Number(hour))}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="avg_amount" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}