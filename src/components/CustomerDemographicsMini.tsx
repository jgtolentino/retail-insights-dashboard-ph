import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DemographicsData {
  ageGroups: Array<{ age_group: string; customer_count: number }>;
  genderSplit: Array<{ gender: string; percentage: number }>;
  peakHour: number;
}

export default function CustomerDemographicsMini() {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-demographics-mini'],
    queryFn: async () => {
      // Age groups
      const { data: ageData } = await supabase
        .from('consumer_demographics_summary')
        .select('age_group, customer_count')
        .order('age_group');

      // Gender split
      const { data: genderData } = await supabase
        .from('consumer_demographics_summary')
        .select('gender, customer_count');

      const totalCustomers = genderData?.reduce((sum, g) => sum + g.customer_count, 0) || 1;
      const genderSplit = genderData?.map(g => ({
        gender: g.gender,
        percentage: Math.round((g.customer_count / totalCustomers) * 100),
      }));

      // Peak hour (mock for now, can be derived from transactions)
      const peakHour = 14; // 2 PM

      return {
        ageGroups: ageData || [],
        genderSplit: genderSplit || [],
        peakHour,
      };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topAgeGroup = data?.ageGroups.reduce(
    (max, group) => (group.customer_count > (max?.customer_count || 0) ? group : max),
    data?.ageGroups[0]
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Customer Demographics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Age Group */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Top Age Group</span>
          <span className="text-sm font-semibold">{topAgeGroup?.age_group || 'N/A'}</span>
        </div>

        {/* Gender Split */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Gender Split</span>
          <div className="flex gap-4">
            {data?.genderSplit.map(g => (
              <div key={g.gender} className="flex items-center gap-1">
                <div
                  className={`h-3 w-3 rounded-full ${
                    g.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                  }`}
                ></div>
                <span className="text-xs">
                  {g.gender}: {g.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hour */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Peak Hour
          </span>
          <span className="text-sm font-semibold">
            {data?.peakHour > 12 ? `${data.peakHour - 12} PM` : `${data?.peakHour} AM`}
          </span>
        </div>

        {/* Trend Indicator */}
        <div className="border-t pt-2">
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">+12% new customers this month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
