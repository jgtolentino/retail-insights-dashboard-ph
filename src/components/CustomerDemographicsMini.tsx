import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const CustomerDemographicsMini = () => {
  // Use actual transactions table with customer data
  const { data: genderData, isLoading: genderLoading } = useQuery({
    queryKey: ['gender-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('customer_gender')
        .not('customer_gender', 'is', null);
      
      if (error) throw error;
      
      const genderCounts = data.reduce((acc: Record<string, number>, transaction) => {
        const gender = transaction.customer_gender || 'Unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {});

      const total = Object.values(genderCounts).reduce((sum: number, count: number) => sum + count, 0);
      
      return Object.entries(genderCounts).map(([gender, count]) => ({
        gender,
        customer_count: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) || '0' : '0'
      }));
    }
  });

  const { data: ageData, isLoading: ageLoading } = useQuery({
    queryKey: ['age-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('customer_age')
        .not('customer_age', 'is', null);
      
      if (error) throw error;
      
      const ageCounts = data.reduce((acc: Record<string, number>, transaction) => {
        const age = transaction.customer_age;
        if (!age) return acc;
        
        let ageGroup;
        if (age < 25) ageGroup = '18-24';
        else if (age < 35) ageGroup = '25-34';
        else if (age < 45) ageGroup = '35-44';
        else if (age < 55) ageGroup = '45-54';
        else ageGroup = '55+';
        
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        return acc;
      }, {});

      const total = Object.values(ageCounts).reduce((sum: number, count: number) => sum + count, 0);
      
      return Object.entries(ageCounts).map(([age_group, count]) => ({
        age_group,
        customer_count: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) || '0' : '0'
      }));
    }
  });

  if (genderLoading || ageLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Loading demographics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Demographics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Gender Distribution */}
          <div>
            <h4 className="font-medium mb-2">By Gender</h4>
            <div className="space-y-2">
              {genderData?.map((item: any) => (
                <div key={item.gender} className="flex justify-between text-sm">
                  <span>{item.gender}</span>
                  <span>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Age Distribution */}
          <div>
            <h4 className="font-medium mb-2">By Age Group</h4>
            <div className="space-y-2">
              {ageData?.map((item: any) => (
                <div key={item.age_group} className="flex justify-between text-sm">
                  <span>{item.age_group}</span>
                  <span>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
