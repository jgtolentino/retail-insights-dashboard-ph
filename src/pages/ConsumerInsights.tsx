
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, TrendingUp, Heart, Filter } from 'lucide-react';
import { AgeDistribution } from '@/components/charts/AgeDistribution';
import { GenderDistribution } from '@/components/charts/GenderDistribution';
import { PurchasePatterns } from '@/components/charts/PurchasePatterns';
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
  formatDateForQuery
} from '@/types/filters';

export default function ConsumerInsights() {
  const [filters, setFilters] = useState<ConsumerFilters>(DEFAULT_CONSUMER_FILTERS);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.startDate,
    to: filters.endDate
  });

  // Update filters when date range changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setFilters(prev => ({
        ...prev,
        startDate: dateRange.from!,
        endDate: dateRange.to!
      }));
    }
  }, [dateRange]);

  const startDate = formatDateForQuery(filters.startDate);
  const endDate = formatDateForQuery(filters.endDate);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('category')
        .not('category', 'is', null);
      
      const uniqueCategories = [...new Set(data?.map(b => b.category) || [])];
      return uniqueCategories.sort().map(cat => ({ label: cat, value: cat }));
    }
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      return (data || []).map(brand => ({ label: brand.name, value: brand.id.toString() }));
    }
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
      return (data || []).map(product => ({ label: product.name, value: product.id.toString() }));
    }
  });

  const updateFilters = (updates: Partial<ConsumerFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_CONSUMER_FILTERS);
    setDateRange({
      from: DEFAULT_CONSUMER_FILTERS.startDate,
      to: DEFAULT_CONSUMER_FILTERS.endDate
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Consumer Insights</h1>
            <p className="text-muted-foreground">
              Understand customer demographics, behavior, and purchasing patterns
            </p>
          </div>
          
          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>
        </div>

        {/* Multi-Select Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Consumer Segment Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MultiSelect
                options={categories || []}
                selected={filters.categories}
                onChange={(values) => updateFilters({ categories: values })}
                placeholder="Select categories..."
                className="w-full"
              />
              
              <MultiSelect
                options={brands || []}
                selected={filters.brands}
                onChange={(values) => updateFilters({ brands: values })}
                placeholder="Select brands..."
                className="w-full"
              />
              
              <MultiSelect
                options={AGE_GROUP_OPTIONS}
                selected={filters.ageGroups}
                onChange={(values) => updateFilters({ ageGroups: values })}
                placeholder="Select age groups..."
                className="w-full"
              />
              
              <MultiSelect
                options={GENDER_OPTIONS}
                selected={filters.genders}
                onChange={(values) => updateFilters({ genders: values })}
                placeholder="Select genders..."
                className="w-full"
              />
              
              <MultiSelect
                options={LOCATION_OPTIONS}
                selected={filters.locations}
                onChange={(values) => updateFilters({ locations: values })}
                placeholder="Select locations..."
                className="w-full"
              />
            </div>

            {/* Secondary Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MultiSelect
                options={products || []}
                selected={filters.products}
                onChange={(values) => updateFilters({ products: values })}
                placeholder="Select products..."
                className="w-full"
              />
              
              <MultiSelect
                options={INCOME_RANGE_OPTIONS}
                selected={filters.incomeRanges}
                onChange={(values) => updateFilters({ incomeRanges: values })}
                placeholder="Select income ranges..."
                className="w-full"
              />
              
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Reset All Filters
              </Button>
            </div>

            {/* Filter Summary */}
            <FilterSummary 
              filters={filters}
              onClearAll={resetFilters}
              className="pt-2"
            />
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">224</p>
                <p className="text-xs text-muted-foreground mt-1">Current period</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Age</p>
                <p className="text-2xl font-bold">40.2</p>
                <p className="text-xs text-muted-foreground mt-1">Years</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Peak Hour</p>
                <p className="text-2xl font-bold">1-2 AM</p>
                <p className="text-xs text-muted-foreground mt-1">15 transactions</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Locations</p>
                <p className="text-2xl font-bold">50</p>
                <p className="text-xs text-muted-foreground mt-1">Barangays</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="demographics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="behavior">Purchase Behavior</TabsTrigger>
            <TabsTrigger value="segmentation">Customer Segments</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty Metrics</TabsTrigger>
          </TabsList>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Age Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customer Age Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AgeDistribution />
                </CardContent>
              </Card>

              {/* Gender Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gender Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GenderDistribution />
                </CardContent>
              </Card>
            </div>

            {/* Demographics Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Demographics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">28%</div>
                      <div className="text-sm text-muted-foreground">Ages 18-29</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">35%</div>
                      <div className="text-sm text-muted-foreground">Ages 30-44</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">25%</div>
                      <div className="text-sm text-muted-foreground">Ages 45-59</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">12%</div>
                      <div className="text-sm text-muted-foreground">Ages 60+</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Purchase Patterns Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Purchase Behavior Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PurchasePatterns 
                    startDate={startDate} 
                    endDate={endDate}
                  />
                </CardContent>
              </Card>

              {/* Purchase Behavior Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Behavior Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">1-2 AM</div>
                      <div className="text-sm text-muted-foreground">Peak Hours</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Late night activity common in sari-sari stores
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">₱285</div>
                      <div className="text-sm text-muted-foreground">Avg Transaction</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Consistent across all hours
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">24/7</div>
                      <div className="text-sm text-muted-foreground">Operating Hours</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Continuous customer activity
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customer Segmentation Tab */}
          <TabsContent value="segmentation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Customer segmentation dashboard coming soon...
                  <br />
                  Will include high-value customers, frequent buyers, and loyalty segments.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Metrics Tab */}
          <TabsContent value="loyalty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Loyalty & Retention Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Loyalty metrics dashboard coming soon...
                  <br />
                  Will include repeat purchase rates, customer lifetime value, and churn analysis.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
