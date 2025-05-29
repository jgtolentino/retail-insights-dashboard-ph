
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

  // Add query for demographics summary
  const { data: demographicsData, isLoading: demographicsLoading } = useQuery({
    queryKey: ['demographics-summary'],
    queryFn: async () => {
      const [ageResult, genderResult] = await Promise.all([
        supabase.rpc('get_age_distribution_simple'),
        supabase.rpc('get_gender_distribution_simple')
      ]);
      
      return {
        age: ageResult.data || [],
        gender: genderResult.data || []
      };
    }
  });

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
                    {demographicsLoading ? (
                      [...Array(4)].map((_, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                          <div className="h-8 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      ))
                    ) : (
                      demographicsData?.age.map((ageGroup) => (
                        <div key={ageGroup.age_group} className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">
                            {ageGroup.percentage}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Ages {ageGroup.age_group}
                          </div>
                        </div>
                      ))
                    )}
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
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">1-2 AM</div>
                      <div className="text-sm text-gray-600">Peak Hours</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Late night activity common in sari-sari stores
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">₱285</div>
                      <div className="text-sm text-gray-600">Avg Transaction</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Consistent across all hours
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">24/7</div>
                      <div className="text-sm text-gray-600">Operating Hours</div>
                      <div className="text-xs text-gray-500 mt-1">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Value Segments */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Value Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100">
                      <div>
                        <h4 className="font-semibold text-yellow-800">High Value</h4>
                        <p className="text-sm text-yellow-700">₱1,000+ per month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-800">32</div>
                        <div className="text-xs text-yellow-600">14.3% of customers</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                      <div>
                        <h4 className="font-semibold text-blue-800">Medium Value</h4>
                        <p className="text-sm text-blue-700">₱300-999 per month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-800">126</div>
                        <div className="text-xs text-blue-600">56.2% of customers</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                      <div>
                        <h4 className="font-semibold text-gray-800">Low Value</h4>
                        <p className="text-sm text-gray-700">Under ₱300 per month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">66</div>
                        <div className="text-xs text-gray-600">29.5% of customers</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Frequency Segments */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Frequency Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                      <div>
                        <h4 className="font-semibold text-green-800">Frequent Buyers</h4>
                        <p className="text-sm text-green-700">10+ transactions/month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-800">28</div>
                        <div className="text-xs text-green-600">12.5% of customers</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100">
                      <div>
                        <h4 className="font-semibold text-orange-800">Regular Buyers</h4>
                        <p className="text-sm text-orange-700">4-9 transactions/month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-800">98</div>
                        <div className="text-xs text-orange-600">43.8% of customers</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-red-50 to-red-100">
                      <div>
                        <h4 className="font-semibold text-red-800">Occasional Buyers</h4>
                        <p className="text-sm text-red-700">1-3 transactions/month</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-800">98</div>
                        <div className="text-xs text-red-600">43.7% of customers</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Combined Segmentation Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Segmentation Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-700">Segment</th>
                        <th className="text-center p-2 font-medium text-gray-700">Customers</th>
                        <th className="text-center p-2 font-medium text-gray-700">Avg. Monthly Spend</th>
                        <th className="text-center p-2 font-medium text-gray-700">Avg. Frequency</th>
                        <th className="text-center p-2 font-medium text-gray-700">Preferred Categories</th>
                        <th className="text-center p-2 font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-medium">VIP Champions</span>
                          </div>
                        </td>
                        <td className="text-center p-2">18</td>
                        <td className="text-center p-2">₱1,450</td>
                        <td className="text-center p-2">12x/month</td>
                        <td className="text-center p-2 text-sm">Tobacco, Beverages</td>
                        <td className="text-center p-2">
                          <Button size="sm" variant="outline" className="text-xs">Retain & Reward</Button>
                        </td>
                      </tr>
                      
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="font-medium">Loyal Customers</span>
                          </div>
                        </td>
                        <td className="text-center p-2">85</td>
                        <td className="text-center p-2">₱675</td>
                        <td className="text-center p-2">6x/month</td>
                        <td className="text-center p-2 text-sm">Snacks, Household</td>
                        <td className="text-center p-2">
                          <Button size="sm" variant="outline" className="text-xs">Upsell</Button>
                        </td>
                      </tr>
                      
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="font-medium">Potential Loyalists</span>
                          </div>
                        </td>
                        <td className="text-center p-2">56</td>
                        <td className="text-center p-2">₱485</td>
                        <td className="text-center p-2">4x/month</td>
                        <td className="text-center p-2 text-sm">Beverages, Snacks</td>
                        <td className="text-center p-2">
                          <Button size="sm" variant="outline" className="text-xs">Develop</Button>
                        </td>
                      </tr>
                      
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="font-medium">New Customers</span>
                          </div>
                        </td>
                        <td className="text-center p-2">42</td>
                        <td className="text-center p-2">₱285</td>
                        <td className="text-center p-2">2x/month</td>
                        <td className="text-center p-2 text-sm">Basic Needs</td>
                        <td className="text-center p-2">
                          <Button size="sm" variant="outline" className="text-xs">Convert</Button>
                        </td>
                      </tr>
                      
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="font-medium">At-Risk</span>
                          </div>
                        </td>
                        <td className="text-center p-2">23</td>
                        <td className="text-center p-2">₱195</td>
                        <td className="text-center p-2">1x/month</td>
                        <td className="text-center p-2 text-sm">Tobacco, Water</td>
                        <td className="text-center p-2">
                          <Button size="sm" variant="outline" className="text-xs">Re-engage</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Metrics Tab */}
          <TabsContent value="loyalty" className="space-y-4">
            {/* Key Loyalty Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="flex items-center p-6">
                  <Heart className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Repeat Purchase Rate</p>
                    <p className="text-2xl font-bold">72.3%</p>
                    <p className="text-xs text-muted-foreground mt-1">↑ 5.2% vs last month</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-6">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Customer Lifetime Value</p>
                    <p className="text-2xl font-bold">₱2,845</p>
                    <p className="text-xs text-muted-foreground mt-1">Average CLV</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-6">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                    <p className="text-2xl font-bold">8.1%</p>
                    <p className="text-xs text-muted-foreground mt-1">↓ 2.1% vs last month</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="flex items-center p-6">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Purchase Frequency</p>
                    <p className="text-2xl font-bold">4.2x</p>
                    <p className="text-xs text-muted-foreground mt-1">Per month</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Retention Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Retention Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">1 Month Retention</h4>
                        <p className="text-sm text-gray-600">Customers who return within 30 days</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">94.2%</div>
                        <div className="text-xs text-gray-500">211 of 224 customers</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">3 Month Retention</h4>
                        <p className="text-sm text-gray-600">Customers active in last 3 months</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">87.5%</div>
                        <div className="text-xs text-gray-500">196 of 224 customers</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">6 Month Retention</h4>
                        <p className="text-sm text-gray-600">Long-term customer loyalty</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">78.1%</div>
                        <div className="text-xs text-gray-500">175 of 224 customers</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">12 Month Retention</h4>
                        <p className="text-sm text-gray-600">Annual customer loyalty</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">65.2%</div>
                        <div className="text-xs text-gray-500">146 of 224 customers</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Loyalty Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Loyalty Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
                      <div>
                        <h4 className="font-medium text-blue-800">Alaska</h4>
                        <p className="text-sm text-blue-700">Ice cream brand loyalty</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-800">89.3%</div>
                        <div className="text-xs text-blue-600">Repeat purchase rate</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                      <div>
                        <h4 className="font-medium text-green-800">Oishi</h4>
                        <p className="text-sm text-green-700">Snacks brand loyalty</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-800">76.4%</div>
                        <div className="text-xs text-green-600">Repeat purchase rate</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100">
                      <div>
                        <h4 className="font-medium text-yellow-800">Del Monte</h4>
                        <p className="text-sm text-yellow-700">Juice brand loyalty</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-800">71.2%</div>
                        <div className="text-xs text-yellow-600">Repeat purchase rate</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                      <div>
                        <h4 className="font-medium text-gray-800">Winston</h4>
                        <p className="text-sm text-gray-700">Tobacco brand loyalty</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">92.7%</div>
                        <div className="text-xs text-gray-600">Repeat purchase rate</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Lifetime Value Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 border rounded-lg bg-gradient-to-b from-green-50 to-green-100">
                    <div className="text-2xl font-bold text-green-800">₱5,000+</div>
                    <div className="text-sm text-green-700 mt-1">Premium CLV</div>
                    <div className="text-xs text-green-600 mt-2">8 customers (3.6%)</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg bg-gradient-to-b from-blue-50 to-blue-100">
                    <div className="text-2xl font-bold text-blue-800">₱3,000-4,999</div>
                    <div className="text-sm text-blue-700 mt-1">High CLV</div>
                    <div className="text-xs text-blue-600 mt-2">24 customers (10.7%)</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg bg-gradient-to-b from-yellow-50 to-yellow-100">
                    <div className="text-2xl font-bold text-yellow-800">₱1,500-2,999</div>
                    <div className="text-sm text-yellow-700 mt-1">Medium CLV</div>
                    <div className="text-xs text-yellow-600 mt-2">89 customers (39.7%)</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg bg-gradient-to-b from-orange-50 to-orange-100">
                    <div className="text-2xl font-bold text-orange-800">₱750-1,499</div>
                    <div className="text-sm text-orange-700 mt-1">Low CLV</div>
                    <div className="text-xs text-orange-600 mt-2">68 customers (30.4%)</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg bg-gradient-to-b from-red-50 to-red-100">
                    <div className="text-2xl font-bold text-red-800">Under ₱750</div>
                    <div className="text-sm text-red-700 mt-1">Very Low CLV</div>
                    <div className="text-xs text-red-600 mt-2">35 customers (15.6%)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Program Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Loyalty Program Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <h4 className="font-semibold text-blue-800 mb-2">VIP Champions Program</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Exclusive rewards for top 18 customers spending ₱1,000+ monthly
                    </p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• 10% cashback on all purchases</li>
                      <li>• Priority access to new products</li>
                      <li>• Monthly appreciation gifts</li>
                      <li>• Special discount days</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                    <h4 className="font-semibold text-green-800 mb-2">Frequent Buyer Rewards</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Points-based system for customers with 4+ monthly transactions
                    </p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• 1 point per ₱10 spent</li>
                      <li>• 100 points = ₱50 discount</li>
                      <li>• Bonus points on TBWA brands</li>
                      <li>• Birthday month double points</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <h4 className="font-semibold text-yellow-800 mb-2">Win-Back Campaign</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Re-engagement strategy for 23 at-risk customers
                    </p>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      <li>• Personalized discount offers</li>
                      <li>• Free product samples</li>
                      <li>• SMS promotions on favorites</li>
                      <li>• Store credit incentives</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
