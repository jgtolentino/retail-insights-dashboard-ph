import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandData {
  id: string;
  name: string;
  revenue: number;
  transactions: number;
  marketShare: number;
  growth: number;
  isTBWA: boolean;
  category: string;
  avgTransactionValue: number;
}

interface TBWABrandPerformanceGridProps {
  brands: BrandData[];
  className?: string;
  maxBrands?: number;
  showTBWAFirst?: boolean;
}

export function TBWABrandPerformanceGrid({
  brands,
  className,
  maxBrands = 8,
  showTBWAFirst = true,
}: TBWABrandPerformanceGridProps) {
  const sortedBrands = useMemo(() => {
    const sortedData = [...brands];

    if (showTBWAFirst) {
      // Sort TBWA brands first, then by revenue
      sortedData.sort((a, b) => {
        if (a.isTBWA && !b.isTBWA) return -1;
        if (!a.isTBWA && b.isTBWA) return 1;
        return b.revenue - a.revenue;
      });
    } else {
      // Sort by revenue only
      sortedData.sort((a, b) => b.revenue - a.revenue);
    }

    return sortedData.slice(0, maxBrands);
  }, [brands, showTBWAFirst, maxBrands]);

  const topRevenue = sortedBrands[0]?.revenue || 1;

  const formatRevenue = (revenue: number) => {
    if (revenue >= 1000000) {
      return `₱${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `₱${(revenue / 1000).toFixed(1)}K`;
    }
    return `₱${revenue.toLocaleString()}`;
  };

  const formatATV = (atv: number) => {
    return `₱${atv.toLocaleString()}`;
  };

  const getBrandRank = (index: number) => {
    if (index === 0) return <Award className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Award className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-medium text-gray-500">#{index + 1}</span>;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Brand Performance Overview
          <Badge variant="outline" className="ml-auto">
            Top {sortedBrands.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sortedBrands.map((brand, index) => (
            <Card
              key={brand.id}
              className={cn(
                'relative transition-all hover:shadow-md',
                brand.isTBWA && 'ring-2 ring-tbwa-orange/20'
              )}
            >
              <CardContent className="p-4">
                {/* Brand Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getBrandRank(index)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                      <span className="text-xs text-gray-500">{brand.category}</span>
                    </div>
                  </div>

                  {brand.isTBWA && (
                    <Badge className="bg-tbwa-orange text-white hover:bg-tbwa-orange/90">
                      TBWA
                    </Badge>
                  )}
                </div>

                {/* Revenue and Progress */}
                <div className="mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="font-semibold">{formatRevenue(brand.revenue)}</span>
                  </div>
                  <Progress
                    value={(brand.revenue / topRevenue) * 100}
                    className="h-2"
                    style={
                      {
                        '--progress-background': brand.isTBWA ? '#F89E1B' : '#0078d4',
                      } as React.CSSProperties
                    }
                  />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Market Share</div>
                    <div className="text-sm font-semibold">{brand.marketShare.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Transactions</div>
                    <div className="text-sm font-semibold">
                      {brand.transactions.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Avg. Value</div>
                    <div className="text-sm font-semibold">
                      {formatATV(brand.avgTransactionValue)}
                    </div>
                  </div>
                </div>

                {/* Growth Indicator */}
                <div className="mt-3 flex items-center justify-center border-t pt-3">
                  {brand.growth > 0 ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs font-medium">+{brand.growth.toFixed(1)}%</span>
                    </div>
                  ) : brand.growth < 0 ? (
                    <div className="flex items-center gap-1 text-red-600">
                      <TrendingDown className="h-3 w-3" />
                      <span className="text-xs font-medium">{brand.growth.toFixed(1)}%</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">No change</span>
                  )}
                </div>

                {/* TBWA Brand Accent */}
                {brand.isTBWA && (
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-tbwa-blue to-tbwa-orange" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-sm text-gray-600">Total TBWA Brands</div>
              <div className="text-lg font-semibold text-tbwa-blue">
                {sortedBrands.filter(b => b.isTBWA).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">TBWA Revenue Share</div>
              <div className="text-lg font-semibold text-tbwa-orange">
                {(
                  (sortedBrands.filter(b => b.isTBWA).reduce((sum, b) => sum + b.revenue, 0) /
                    sortedBrands.reduce((sum, b) => sum + b.revenue, 0)) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Top Performer</div>
              <div className="text-lg font-semibold text-gray-900">{sortedBrands[0]?.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Fastest Growing</div>
              <div className="text-lg font-semibold text-green-600">
                {
                  sortedBrands.reduce(
                    (max, brand) => (brand.growth > max.growth ? brand : max),
                    sortedBrands[0]
                  )?.name
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
