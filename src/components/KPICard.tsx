import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  deltaPercentage?: number;
  deltaLabel?: string;
  format?: 'currency' | 'number' | 'percentage';
  loading?: boolean;
  error?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function KPICard({
  title,
  value,
  previousValue,
  deltaPercentage,
  deltaLabel = 'vs last period',
  format = 'number',
  loading = false,
  error,
  subtitle,
  icon,
  color = 'blue',
  size = 'md',
  onClick,
  className
}: KPICardProps) {
  
  const formatValue = (val: string | number, fmt: typeof format): string => {
    if (typeof val === 'string') return val;
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      
      case 'percentage':
        return `${val.toFixed(1)}%`;
      
      case 'number':
      default:
        return new Intl.NumberFormat('en-PH').format(val);
    }
  };

  const getDeltaIcon = () => {
    if (!deltaPercentage) return <Minus className="h-3 w-3" />;
    if (deltaPercentage > 0) return <TrendingUp className="h-3 w-3" />;
    if (deltaPercentage < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getDeltaColor = () => {
    if (!deltaPercentage) return 'text-gray-500';
    return deltaPercentage > 0 ? 'text-green-600' : 'text-red-600';
  };

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/50 text-blue-900',
    green: 'border-green-200 bg-green-50/50 text-green-900',
    orange: 'border-orange-200 bg-orange-50/50 text-orange-900',
    red: 'border-red-200 bg-red-50/50 text-red-900',
    purple: 'border-purple-200 bg-purple-50/50 text-purple-900'
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  if (loading) {
    return (
      <Card className={cn('border-gray-200', sizeClasses[size], className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="pb-2">
          <Skeleton className={cn('mb-2', valueSizeClasses[size])} />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('border-red-200 bg-red-50/50', sizeClasses[size], className)}>
        <CardContent className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Error loading data</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        colorClasses[color],
        sizeClasses[size],
        onClick && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{title}</span>
          {icon && <div className="opacity-60">{icon}</div>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-1">
        {/* Main Value */}
        <div className={cn('font-bold font-mono', valueSizeClasses[size])}>
          {formatValue(value, format)}
        </div>

        {/* Delta and Subtitle */}
        <div className="flex items-center justify-between">
          {deltaPercentage !== undefined && (
            <div className={cn('flex items-center space-x-1 text-xs', getDeltaColor())}>
              {getDeltaIcon()}
              <span className="font-medium">
                {Math.abs(deltaPercentage).toFixed(1)}%
              </span>
            </div>
          )}
          
          {subtitle && (
            <div className="text-xs opacity-60">
              {subtitle}
            </div>
          )}
        </div>

        {/* Delta Label */}
        {deltaPercentage !== undefined && deltaLabel && (
          <div className="text-xs opacity-60">
            {deltaLabel}
          </div>
        )}

        {/* Previous Value Context */}
        {previousValue && (
          <div className="text-xs opacity-60">
            Previous: {formatValue(previousValue, format)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Animated Number Component for smooth value transitions
export function AnimatedKPICard(props: KPICardProps) {
  // This would include number animation logic
  // For now, return the basic KPI card
  return <KPICard {...props} />;
}

// Preset KPI cards for common metrics
export const RevenueKPICard = (props: Omit<KPICardProps, 'format' | 'color'>) => (
  <KPICard {...props} format="currency" color="green" />
);

export const CountKPICard = (props: Omit<KPICardProps, 'format' | 'color'>) => (
  <KPICard {...props} format="number" color="blue" />
);

export const PercentageKPICard = (props: Omit<KPICardProps, 'format' | 'color'>) => (
  <KPICard {...props} format="percentage" color="orange" />
);