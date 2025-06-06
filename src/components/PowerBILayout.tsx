import React from 'react';
import { Filter, Download, RotateCcw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterDrawer } from '@/components/FilterDrawer';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { KPICard } from '@/components/KPICard';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { useExport } from '@/lib/exportUtils';

interface PowerBILayoutProps {
  children: React.ReactNode;
  title?: string;
  showFilters?: boolean;
  kpiData?: Array<{
    title: string;
    value: string | number;
    deltaPercentage?: number;
    format?: 'currency' | 'number' | 'percentage';
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  }>;
}

export function PowerBILayout({ 
  children, 
  title = "Retail Insights Dashboard PH",
  showFilters = true,
  kpiData = []
}: PowerBILayoutProps) {
  const {
    toggleFilterDrawer,
    hasActiveFilters,
    getFilterSummary,
    resetFilters,
    dateRange
  } = useGlobalFilters();

  const { exportChart } = useExport();

  const handleExportDashboard = async () => {
    try {
      await exportChart('main-dashboard', 'pdf', 'dashboard-export');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RI</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>

            {/* Date Range Display */}
            <Badge variant="outline" className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {dateRange.preset === 'custom' 
                  ? `${dateRange.start} to ${dateRange.end}`
                  : `Last ${dateRange.preset?.replace('d', ' days') || '30 days'}`
                }
              </span>
            </Badge>

            {/* Active Filters Summary */}
            {hasActiveFilters() && (
              <Badge variant="secondary" className="text-xs">
                {getFilterSummary()}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Controls */}
            {showFilters && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFilterDrawer}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Active
                    </Badge>
                  )}
                </Button>

                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDashboard}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>

            {/* Dark Mode Toggle */}
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-dashboard" className="p-6">
        {/* KPI Strip */}
        {kpiData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {kpiData.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                deltaPercentage={kpi.deltaPercentage}
                format={kpi.format}
                color={kpi.color}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Chart Grid */}
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* Filter Drawer */}
      <FilterDrawer />
    </div>
  );
}