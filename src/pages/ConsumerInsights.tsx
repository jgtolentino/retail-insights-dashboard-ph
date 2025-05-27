import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, TrendingUp, Heart } from 'lucide-react';
import { AgeDistribution } from '@/components/charts/AgeDistribution';
import { GenderDistribution } from '@/components/charts/GenderDistribution';
import { SprintDashboard } from '@/components/SprintDashboard';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

export default function ConsumerInsights() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date('2025-04-30'),
    to: new Date('2025-05-30')
  });

  const startDate = dateRange?.from?.toISOString().split('T')[0] || '2025-04-30';
  const endDate = dateRange?.to?.toISOString().split('T')[0] || '2025-05-30';

  return (
    <SprintDashboard sprint={3}>
      <div className="space-y-6">
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">2,847</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Age</p>
                <p className="text-2xl font-bold">34.2</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Repeat Rate</p>
                <p className="text-2xl font-bold">68%</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">High Value</p>
                <p className="text-2xl font-bold">387</p>
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
                  <AgeDistribution 
                    startDate={startDate} 
                    endDate={endDate}
                    bucketSize={10}
                  />
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
                  <GenderDistribution 
                    startDate={startDate} 
                    endDate={endDate}
                  />
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
            <Card>
              <CardHeader>
                <CardTitle>Purchase Behavior Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Purchase behavior analytics coming soon...
                  <br />
                  Will include frequency analysis, basket size by demographics, and time patterns.
                </div>
              </CardContent>
            </Card>
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
    </SprintDashboard>
  );
}