import { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              {subtitle}
            </p>
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