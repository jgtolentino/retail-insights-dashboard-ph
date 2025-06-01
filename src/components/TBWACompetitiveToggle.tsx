import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Building2, Filter } from 'lucide-react';

interface TBWACompetitiveToggleProps {
  value: boolean | null; // null = all, true = TBWA only, false = competitors only
  onValueChange: (value: boolean | null) => void;
  tbwaStats?: {
    tbwa_brands: number;
    competitor_brands: number;
    total_brands: number;
  };
  showCounts?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TBWACompetitiveToggle: React.FC<TBWACompetitiveToggleProps> = ({
  value,
  onValueChange,
  tbwaStats,
  showCounts = true,
  size = 'md',
}) => {
  const toggleValue = value === null ? 'all' : value === true ? 'tbwa' : 'competitors';

  const handleValueChange = (newValue: string) => {
    switch (newValue) {
      case 'all':
        onValueChange(null);
        break;
      case 'tbwa':
        onValueChange(true);
        break;
      case 'competitors':
        onValueChange(false);
        break;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        type="single"
        value={toggleValue}
        onValueChange={handleValueChange}
        className="grid w-full grid-cols-3"
      >
        <ToggleGroupItem
          value="all"
          className={`flex items-center gap-2 ${sizeClasses[size]}`}
          variant="outline"
        >
          <Filter className="h-4 w-4" />
          <span>All Brands</span>
          {showCounts && tbwaStats && (
            <Badge variant="secondary" className="ml-1">
              {tbwaStats.total_brands}
            </Badge>
          )}
        </ToggleGroupItem>

        <ToggleGroupItem
          value="tbwa"
          className={`flex items-center gap-2 ${sizeClasses[size]} data-[state=on]:border-yellow-300 data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-800`}
          variant="outline"
        >
          <Sparkles className="h-4 w-4" />
          <span>TBWA Clients</span>
          {showCounts && tbwaStats && (
            <Badge variant="secondary" className="ml-1 bg-yellow-200 text-yellow-800">
              {tbwaStats.tbwa_brands}
            </Badge>
          )}
        </ToggleGroupItem>

        <ToggleGroupItem
          value="competitors"
          className={`flex items-center gap-2 ${sizeClasses[size]} data-[state=on]:border-blue-300 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800`}
          variant="outline"
        >
          <Building2 className="h-4 w-4" />
          <span>Competitors</span>
          {showCounts && tbwaStats && (
            <Badge variant="secondary" className="ml-1 bg-blue-200 text-blue-800">
              {tbwaStats.competitor_brands}
            </Badge>
          )}
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Market Share Indicator */}
      {value !== null && tbwaStats && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {value === true ? (
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-600" />
              <span>Showing {tbwaStats.tbwa_brands} TBWA client brands</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-blue-600" />
              <span>Showing {tbwaStats.competitor_brands} competitor brands</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Market Share Widget Component
interface MarketShareWidgetProps {
  tbwaShare: number;
  tbwaRevenue: number;
  competitorRevenue: number;
  className?: string;
}

export const MarketShareWidget: React.FC<MarketShareWidgetProps> = ({
  tbwaShare,
  tbwaRevenue,
  competitorRevenue,
  className = '',
}) => {
  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">TBWA Market Share</h3>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4 h-6 rounded-full bg-gray-200">
        <div
          className="flex h-full items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-sm font-medium text-white"
          style={{ width: `${Math.max(tbwaShare, 10)}%` }} // Minimum 10% for visibility
        >
          {tbwaShare.toFixed(1)}%
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="mb-1 flex items-center justify-center gap-1">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-gray-700">TBWA</span>
          </div>
          <div className="text-lg font-bold text-yellow-600">{formatCurrency(tbwaRevenue)}</div>
        </div>

        <div className="text-center">
          <div className="mb-1 flex items-center justify-center gap-1">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-700">Competitors</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{formatCurrency(competitorRevenue)}</div>
        </div>
      </div>

      {/* Market Dominance Indicator */}
      <div className="mt-3 border-t pt-3">
        <div className="text-center">
          {tbwaShare >= 70 ? (
            <Badge className="border-green-300 bg-green-100 text-green-800">🏆 Market Leader</Badge>
          ) : tbwaShare >= 50 ? (
            <Badge className="border-yellow-300 bg-yellow-100 text-yellow-800">
              📈 Strong Position
            </Badge>
          ) : (
            <Badge className="border-blue-300 bg-blue-100 text-blue-800">
              🤝 Competitive Market
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default TBWACompetitiveToggle;
