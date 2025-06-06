/**
 * Consumer Segments Page
 *
 * "What can be done?" - Customer segmentation and behavioral analysis
 * Deep insights into customer demographics, purchase patterns, and targeting opportunities
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  TrendingUp,
  Heart,
  Filter,
  Target,
  UserCheck,
  Lightbulb,
} from 'lucide-react';
import { AgeDistribution } from '@/components/charts/AgeDistribution';
import { GenderDistribution } from '@/components/charts/GenderDistribution';
import { PurchasePatterns } from '@/components/charts/PurchasePatterns';
import { SuggestionFunnel } from '@/components/charts/SuggestionFunnel';
import { HierarchicalSubstitutions } from '@/components/charts/HierarchicalSubstitutions';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { FilterSummary } from '@/components/FilterSummary';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ConsumerFilters,
  DEFAULT_CONSUMER_FILTERS,
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  LOCATION_OPTIONS,
  INCOME_RANGE_OPTIONS,
  formatDateForQuery,
} from '@/types/filters';

export default function ConsumerSegments() {
  const [filters, setFilters] = useState<ConsumerFilters>(DEFAULT_CONSUMER_FILTERS);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.startDate,
    to: filters.endDate,
  });

  // Update filters when date range changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setFilters(prev => ({
        ...prev,
        startDate: dateRange.from!,
        endDate: dateRange.to!,
      }));
    }
  }, [dateRange]);

  const startDate = formatDateForQuery(filters.startDate);
  const endDate = formatDateForQuery(filters.endDate);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;

      const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
      return uniqueCategories.map(category => ({
        value: category,
        label: category,
      }));
    },
  });

  // Consumer summary metrics
  const { data: consumerMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['consumer-metrics', startDate, endDate, filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('customer_age, customer_gender, total_amount, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const totalCustomers = data.length;
      const totalRevenue = data.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const avgAge = data.reduce((sum, t) => sum + (t.customer_age || 0), 0) / totalCustomers;
      const genderDistribution = data.reduce(
        (acc, t) => {
          if (t.customer_gender === 'Male') acc.male++;
          else if (t.customer_gender === 'Female') acc.female++;
          return acc;
        },
        { male: 0, female: 0 }
      );

      return {
        totalCustomers,
        totalRevenue,
        avgAge: Math.round(avgAge),
        avgSpend: totalRevenue / totalCustomers,
        genderSplit: {
          male: (genderDistribution.male / totalCustomers) * 100,
          female: (genderDistribution.female / totalCustomers) * 100,
        },
      };
    },
  });

  const handleFilterChange = (key: keyof ConsumerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_CONSUMER_FILTERS);
    setDateRange({
      from: DEFAULT_CONSUMER_FILTERS.startDate,
      to: DEFAULT_CONSUMER_FILTERS.endDate,
    });
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Power BI Style Header - "What can be done?" Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Target className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">What Can Be Done?</h1>
            <p className="text-lg font-medium text-purple-600">Consumer Segments & Targeting</p>
          </div>
        </div>
        <p className="max-w-2xl text-gray-600">
          Understand your customer base through detailed demographic analysis and behavioral
          segmentation. Identify high-value customer segments and develop targeted marketing
          strategies to maximize engagement and revenue.
        </p>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Consumer Analysis Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Age Groups</label>
              <MultiSelect
                options={AGE_GROUP_OPTIONS}
                selected={filters.ageGroups}
                onChange={value => handleFilterChange('ageGroups', value)}
                placeholder="Select age groups"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <MultiSelect
                options={GENDER_OPTIONS}
                selected={filters.genders}
                onChange={value => handleFilterChange('genders', value)}
                placeholder="Select genders"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Locations</label>
              <MultiSelect
                options={LOCATION_OPTIONS}
                selected={filters.locations}
                onChange={value => handleFilterChange('locations', value)}
                placeholder="Select locations"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Income Range</label>
              <MultiSelect
                options={INCOME_RANGE_OPTIONS}
                selected={filters.incomeRanges}
                onChange={value => handleFilterChange('incomeRanges', value)}
                placeholder="Select income ranges"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product Categories</label>
              <MultiSelect
                options={categories || []}
                selected={filters.categories}
                onChange={value => handleFilterChange('categories', value)}
                placeholder="Select categories"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <FilterSummary filters={filters} />
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consumer Metrics Overview */}
      {consumerMetrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {consumerMetrics.totalCustomers.toLocaleString()}
              </div>
              <p className="text-xs text-blue-700">Unique customers analyzed</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                ₱{Math.round(consumerMetrics.avgSpend).toLocaleString()}
              </div>
              <p className="text-xs text-green-700">Per customer spend</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Age</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{consumerMetrics.avgAge}</div>
              <p className="text-xs text-purple-700">Years old</p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-pink-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gender Split</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-pink-900">
                {consumerMetrics.genderSplit.female.toFixed(0)}%F /{' '}
                {consumerMetrics.genderSplit.male.toFixed(0)}%M
              </div>
              <p className="text-xs text-pink-700">Gender distribution</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Segmentation Insights */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Lightbulb className="h-5 w-5" />
                Customer Segmentation Strategy
              </CardTitle>
              <p className="mt-1 text-sm text-purple-700">
                Actionable insights for targeted marketing and customer engagement
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-purple-900">🎯 High-Value Segments</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• Target 35-45 age group for premium products</li>
                <li>• Focus on female customers for household items</li>
                <li>• Urban professionals: convenience-focused marketing</li>
                <li>• Family segments: bulk purchase incentives</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-blue-900">📊 Behavioral Patterns</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Weekend shoppers: promotional campaigns</li>
                <li>• Loyalty program opportunities for repeat customers</li>
                <li>• Cross-selling based on purchase history</li>
                <li>• Seasonal buying behavior optimization</li>
              </ul>
            </div>

            <div className="rounded-lg border border-green-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-green-900">💡 Growth Opportunities</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Expand reach to underserved age groups</li>
                <li>• Develop products for emerging segments</li>
                <li>• Regional expansion based on demographics</li>
                <li>• Digital engagement for younger customers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="behavior">Purchase Behavior</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="substitutions">Substitutions</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <AgeDistribution
              startDate={startDate}
              endDate={endDate}
              ageGroups={filters.ageGroups}
              genders={filters.genders}
              locations={filters.locations}
            />
            <GenderDistribution
              startDate={startDate}
              endDate={endDate}
              ageGroups={filters.ageGroups}
              genders={filters.genders}
              locations={filters.locations}
            />
          </div>
        </TabsContent>

        <TabsContent value="behavior">
          <PurchasePatterns
            startDate={startDate}
            endDate={endDate}
            ageGroups={filters.ageGroups}
            genders={filters.genders}
            locations={filters.locations}
            categories={filters.categories}
            incomeRanges={filters.incomeRanges}
          />
        </TabsContent>

        <TabsContent value="suggestions">
          <SuggestionFunnel
            startDate={startDate}
            endDate={endDate}
            ageGroups={filters.ageGroups}
            genders={filters.genders}
            locations={filters.locations}
            categories={filters.categories}
          />
        </TabsContent>

        <TabsContent value="substitutions">
          <HierarchicalSubstitutions
            startDate={startDate}
            endDate={endDate}
            ageGroups={filters.ageGroups}
            genders={filters.genders}
            locations={filters.locations}
            categories={filters.categories}
          />
        </TabsContent>
      </Tabs>

      {/* Customer Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Key Customer Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-2 font-medium text-blue-900">👥 Demographics</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Age range: 18-65 years</li>
                <li>• Primary segment: 25-45 years</li>
                <li>• Gender balance varies by product</li>
                <li>• Urban and suburban focus</li>
              </ul>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="mb-2 font-medium text-green-900">🛒 Shopping Behavior</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Repeat purchase patterns</li>
                <li>• Brand loyalty indicators</li>
                <li>• Seasonal preferences</li>
                <li>• Price sensitivity analysis</li>
              </ul>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="mb-2 font-medium text-purple-900">💬 Engagement</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• High suggestion acceptance rates</li>
                <li>• Active substitution behavior</li>
                <li>• Responsive to recommendations</li>
                <li>• Cross-category purchases</li>
              </ul>
            </div>

            <div className="rounded-lg bg-orange-50 p-4">
              <h4 className="mb-2 font-medium text-orange-900">📈 Opportunities</h4>
              <ul className="space-y-1 text-sm text-orange-800">
                <li>• Upselling potential</li>
                <li>• Category expansion</li>
                <li>• Loyalty program growth</li>
                <li>• Digital engagement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
