// Client-specific component - requires customization
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CLIENTMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  isCLIENTBrand?: boolean;
  className?: string;
}

export function CLIENTMetricCard({
  title,
  value,
  change,
  icon,
  color = '#0078d4',
  trend,
  subtitle,
  isCLIENTBrand = false,
  className,
}: CLIENTMetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined && !trend) return null;

    const actualTrend = trend || (change! > 0 ? 'up' : change! < 0 ? 'down' : 'neutral');
    const actualChange = change || 0;

    switch (actualTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (change === undefined && !trend) return 'text-gray-500';

    const actualTrend = trend || (change! > 0 ? 'up' : change! < 0 ? 'down' : 'neutral');

    switch (actualTrend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={cn('relative overflow-hidden transition-all hover:shadow-lg', className)}>
      {/* CLIENT Brand Indicator */}
      {isCLIENTBrand && (
        <div className="absolute right-2 top-2">
          <Badge variant="secondary" className="bg-client-orange text-xs font-medium text-white">
            CLIENT
          </Badge>
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div
          className="flex items-center justify-center rounded-lg p-2"
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          {icon}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Main Value */}
          <div className="text-2xl font-bold text-gray-900">{formatValue(value)}</div>

          {/* Subtitle */}
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}

          {/* Trend Indicator */}
          {(change !== undefined || trend) && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={cn('text-sm font-medium', getTrendColor())}>
                {change !== undefined ? `${Math.abs(change)}%` : ''}
              </span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* CLIENT Brand Accent */}
      {isCLIENTBrand && (
        <div className="from-client-blue to-client-orange absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r" />
      )}
    </Card>
  );
}

// Pre-configured CLIENT metric cards
export function CLIENTRevenueCard({
  value,
  change,
  isCLIENTBrand = false,
}: {
  value: string | number;
  change?: number;
  isCLIENTBrand?: boolean;
}) {
  return (
    <CLIENTMetricCard
      title="Total Revenue"
      value={value}
      change={change}
      icon={<TrendingUp className="h-4 w-4" />}
      color="#0078d4"
      isCLIENTBrand={isCLIENTBrand}
      subtitle="Monthly Performance"
    />
  );
}

export function CLIENTTransactionCard({
  value,
  change,
  isCLIENTBrand = false,
}: {
  value: string | number;
  change?: number;
  isCLIENTBrand?: boolean;
}) {
  return (
    <CLIENTMetricCard
      title="Transactions"
      value={value}
      change={change}
      icon={<TrendingUp className="h-4 w-4" />}
      color="#F89E1B"
      isCLIENTBrand={isCLIENTBrand}
      subtitle="Total Count"
    />
  );
}
