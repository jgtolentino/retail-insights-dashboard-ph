import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Download, Search, Filter, RefreshCw } from 'lucide-react';
import { behavioralDashboardService } from '@/services/behavioral-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BehaviorSuggestionsTableProps {
  startDate?: string;
  endDate?: string;
  storeId?: number;
}

export function BehaviorSuggestionsTable({
  startDate,
  endDate,
  storeId: initialStoreId,
}: BehaviorSuggestionsTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [storeId, setStoreId] = useState<number | undefined>(initialStoreId);

  // Get unique regions from data
  const regions = [...new Set(data.map(item => item.region))].sort();

  useEffect(() => {
    fetchBehaviorData();
  }, [startDate, endDate, storeId]);

  const fetchBehaviorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const behaviorData = await behavioralDashboardService.getBehaviorSuggestions(
        startDate,
        endDate,
        storeId
      );
      setData(behaviorData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load behavior suggestions');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch =
      searchTerm === '' ||
      item.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = selectedRegion === 'all' || item.region === selectedRegion;

    return matchesSearch && matchesRegion;
  });

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Store ID',
      'Store Name',
      'Region',
      'Total Transactions',
      'Suggestions Offered',
      'Suggestions Accepted',
      'Acceptance Rate (%)',
    ];
    const csvData = filteredData.map(item => [
      item.date,
      item.storeId,
      item.storeName,
      item.region,
      item.totalTransactions,
      item.suggestionsOffered,
      item.suggestionsAccepted,
      item.suggestionAcceptanceRate,
    ]);

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavior-suggestions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getAcceptanceRateBadge = (rate: number) => {
    if (rate >= 70) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 50) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rate >= 30) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Behavior Suggestions View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchBehaviorData} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Behavior Suggestions Analytics
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBehaviorData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="search"
                placeholder="Search by store name or region..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-[200px]">
            <Label htmlFor="region" className="sr-only">
              Filter by Region
            </Label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger id="region">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Total Stores</p>
            <p className="text-2xl font-bold">{[...new Set(data.map(d => d.storeId))].length}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-600">Total Suggestions</p>
            <p className="text-2xl font-bold text-blue-900">
              {data.reduce((sum, d) => sum + d.suggestionsOffered, 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-600">Accepted Suggestions</p>
            <p className="text-2xl font-bold text-green-900">
              {data.reduce((sum, d) => sum + d.suggestionsAccepted, 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-sm text-purple-600">Overall Acceptance Rate</p>
            <p className="text-2xl font-bold text-purple-900">
              {data.length > 0
                ? (
                    (data.reduce((sum, d) => sum + d.suggestionsAccepted, 0) /
                      data.reduce((sum, d) => sum + d.suggestionsOffered, 0)) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Offered</TableHead>
                <TableHead className="text-right">Accepted</TableHead>
                <TableHead className="text-right">Acceptance Rate</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow key={`${item.date}-${item.storeId}-${index}`}>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.storeName}</p>
                        <p className="text-xs text-gray-500">ID: {item.storeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.region}</TableCell>
                    <TableCell className="text-right">
                      {item.totalTransactions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.suggestionsOffered.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.suggestionsAccepted.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-medium">
                          {item.suggestionAcceptanceRate.toFixed(1)}%
                        </span>
                        <Progress value={item.suggestionAcceptanceRate} className="h-2 w-16" />
                      </div>
                    </TableCell>
                    <TableCell>{getAcceptanceRateBadge(item.suggestionAcceptanceRate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                    No data found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
