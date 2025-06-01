import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface HeaderStatsBoxProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

export function HeaderStatsBox({
  title,
  value,
  subtitle,
  badge,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  trend,
  className = '',
}: HeaderStatsBoxProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Format large numbers
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}k`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>

        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}

        {badge && (
          <Badge variant={badge.variant || 'secondary'} className="mt-1">
            {badge.text}
          </Badge>
        )}

        {trend && (
          <div className={`mt-1 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
            {trend.label && ` ${trend.label}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
