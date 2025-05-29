import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';

interface AgeDistributionProps {
  startDate?: string;
  endDate?: string;
}

export function AgeDistribution({ startDate, endDate }: AgeDistributionProps) {
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['consumer-profile-age', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_consumer_profile', {
          p_start: startDate,
          p_end: endDate
        });
      
      if (error) {
        console.error('Consumer profile error:', error);
        throw error;
      }
      
      console.log('Consumer profile data:', data);
      return data;
    }
  });

  // Process age distribution data into age groups
  const chartData = useMemo(() => {
    if (!profileData?.age_distribution) return [];
    
    const ageGroups = {
      '18-29': 0,
      '30-44': 0,
      '45-59': 0,
      '60+': 0
    };
    
    // Sum up individual ages into groups
    profileData.age_distribution.forEach((item: any) => {
      const age = item.customer_age;
      if (age >= 18 && age <= 29) ageGroups['18-29'] += item.count;
      else if (age >= 30 && age <= 44) ageGroups['30-44'] += item.count;
      else if (age >= 45 && age <= 59) ageGroups['45-59'] += item.count;
      else if (age >= 60) ageGroups['60+'] += item.count;
    });
    
    // Calculate total for percentages
    const total = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
    
    // Convert to chart format
    return Object.entries(ageGroups).map(([ageGroup, count]) => ({
      age_group: ageGroup,
      value: count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [profileData]);
  
  console.log('Processed chart data:', chartData);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Customer Age Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading age data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Customer Age Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-red-500">Error loading age distribution</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Customer Age Distribution
          </CardTitle>
          <CardDescription>
            Distribution of customers by age group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No age distribution data available</p>
              <p className="text-sm mt-1">Check if the database has customer age data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Customer Age Distribution
        </CardTitle>
        <CardDescription>
          Distribution of customers by age group
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age_group" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'percentage') return [`${value}%`, 'Percentage'];
                  return [value, name];
                }}
              />
              <Bar 
                dataKey="percentage" 
                fill="#3b82f6" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
