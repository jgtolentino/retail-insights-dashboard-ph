import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Larger gender icons
const MaleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M15.9 8.1C15.5 7.7 14.9 7.5 14.3 7.5H9.7C9.1 7.5 8.5 7.7 8.1 8.1C7.7 8.5 7.5 9.1 7.5 9.7V14.2C7.5 14.7 7.9 15.1 8.4 15.1S9.3 14.7 9.3 14.2V22H10.8V16.5H13.2V22H14.7V14.2C14.7 14.7 15.1 15.1 15.6 15.1S16.5 14.7 16.5 14.2V9.7C16.5 9.1 16.3 8.5 15.9 8.1Z" />
  </svg>
);

const FemaleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M12 7C14.21 7 16 8.79 16 11V15.5C16 16.03 15.58 16.46 15.05 16.5C14.52 16.53 14.07 16.11 14.03 15.58C14 15.28 14 15 14 14.7V22H10V14.7C10 15 10 15.28 9.97 15.58C9.93 16.11 9.48 16.53 8.95 16.5C8.42 16.46 8 16.03 8 15.5V11C8 8.79 9.79 7 12 7Z" />
  </svg>
);

interface GenderDistributionProps {
  startDate?: string;
  endDate?: string;
}

export function GenderDistribution({ startDate, endDate }: GenderDistributionProps) {
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['consumer-profile', startDate, endDate],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_consumer_profile', {
          p_start: startDate,
          p_end: endDate,
        });

        if (error) {
          console.error('Consumer profile error:', error);
          throw error;
        }

        console.log('Raw consumer profile data:', data); // Debug log

        // Since it returns JSONB, we need to parse it differently
        if (data && typeof data === 'object') {
          // The function returns a JSON object with gender distribution
          // Try different possible property names
          const genderDistribution = data.gender_distribution || data.gender || [];

          // If it's an array, use it directly
          if (Array.isArray(genderDistribution)) {
            return genderDistribution.map((item: any) => ({
              gender: item.customer_gender || item.gender,
              count: item.count || item.customer_count || 0,
              percentage: item.percentage || item.pct || 0,
            }));
          }

          // If it's an object with male/female counts
          if (data.male_count !== undefined || data.female_count !== undefined) {
            return [
              {
                gender: 'male',
                count: data.male_count || 0,
                percentage: data.male_percentage || data.male_pct || 0,
              },
              {
                gender: 'female',
                count: data.female_count || 0,
                percentage: data.female_percentage || data.female_pct || 0,
              },
            ];
          }

          // If the gender data is nested in the response
          if (data.demographics?.gender) {
            const genderData = data.demographics.gender;
            return Object.entries(genderData).map(([gender, value]: [string, any]) => ({
              gender,
              count: value.count || value,
              percentage: value.percentage || 0,
            }));
          }
        }

        // Fallback: query transactions directly
        console.log('Falling back to direct transaction query');
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('customer_gender')
          .not('customer_gender', 'is', null);

        if (txError) throw txError;

        // Group by gender
        const genderCounts =
          transactions?.reduce(
            (acc, t) => {
              const gender = t.customer_gender;
              if (gender) {
                acc[gender] = (acc[gender] || 0) + 1;
              }
              return acc;
            },
            {} as Record<string, number>
          ) || {};

        // Convert to expected format with percentages
        const total = Object.values(genderCounts).reduce((sum, count) => sum + count, 0);
        return Object.entries(genderCounts).map(([gender, count]) => ({
          gender,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
      } catch (error) {
        console.error('Gender distribution query failed:', error);
        throw error;
      }
    },
  });

  // Process the data
  const data = profileData || [];

  // Calculate percentages - use percentage from data if available
  const maleData = data.find((item: any) => item.gender === 'male' || item.gender === 'Male');
  const femaleData = data.find((item: any) => item.gender === 'female' || item.gender === 'Female');

  const maleCount = maleData?.count || 0;
  const femaleCount = femaleData?.count || 0;
  const total = maleCount + femaleCount;

  // Use percentage from data if available, otherwise calculate
  const malePercentage =
    maleData?.percentage || (total > 0 ? Math.round((maleCount / total) * 100) : 0);
  const femalePercentage =
    femaleData?.percentage || (total > 0 ? Math.round((femaleCount / total) * 100) : 0);

  // Debug logging
  console.log('Processed gender data:', {
    data,
    maleData,
    femaleData,
    counts: { total, maleCount, femaleCount, malePercentage, femalePercentage },
  });

  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading gender distribution. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">Gender Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Larger gender icons with percentages */}
        <div className="flex justify-center gap-12 py-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-blue-200">
              <MaleIcon className="h-14 w-14 text-blue-600" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{malePercentage}%</div>
              <div className="text-sm text-gray-600">Male</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-pink-200">
              <FemaleIcon className="h-14 w-14 text-pink-600" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{femalePercentage}%</div>
              <div className="text-sm text-gray-600">Female</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
