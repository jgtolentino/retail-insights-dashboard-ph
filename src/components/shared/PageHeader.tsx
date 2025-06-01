import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
  showRefreshButton?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  children,
  onRefresh,
  isLoading = false,
  showRefreshButton = true,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground sm:mt-2 sm:text-base">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {children}

          {showRefreshButton && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
