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
  size = 'md'
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
    lg: 'text-base px-4 py-3'
  };

  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        type="single"
        value={toggleValue}
        onValueChange={handleValueChange}
        className="grid grid-cols-3 w-full"
      >
        <ToggleGroupItem 
          value="all" 
          className={`flex items-center gap-2 ${sizeClasses[size]}`}
          variant="outline"
        >
          <Filter className="w-4 h-4" />
          <span>All Brands</span>
          {showCounts && tbwaStats && (
            <Badge variant="secondary" className="ml-1">
              {tbwaStats.total_brands}
            </Badge>
          )}
        </ToggleGroupItem>

        <ToggleGroupItem 
          value="tbwa" 
          className={`flex items-center gap-2 ${sizeClasses[size]} data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-800 data-[state=on]:border-yellow-300`}
          variant="outline"
        >
          <Sparkles className="w-4 h-4" />
          <span>TBWA Clients</span>
          {showCounts && tbwaStats && (
            <Badge variant="secondary" className="ml-1 bg-yellow-200 text-yellow-800">
              {tbwaStats.tbwa_brands}
            </Badge>
          )}
        </ToggleGroupItem>

        <ToggleGroupItem 
          value="competitors" 
          className={`flex items-center gap-2 ${sizeClasses[size]} data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800 data-[state=on]:border-blue-300`}
          variant="outline"
        >
          <Building2 className="w-4 h-4" />
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
              <Sparkles className="w-3 h-3 text-yellow-600" />
              <span>Showing {tbwaStats.tbwa_brands} TBWA client brands</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
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
  className = ''
}) => {
  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">TBWA Market Share</h3>
      </div>

      {/* Progress Bar */}
      <div className="relative h-6 bg-gray-200 rounded-full mb-4">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-sm font-medium"
          style={{ width: `${Math.max(tbwaShare, 10)}%` }} // Minimum 10% for visibility
        >
          {tbwaShare.toFixed(1)}%
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-gray-700">TBWA</span>
          </div>
          <div className="text-lg font-bold text-yellow-600">
            {formatCurrency(tbwaRevenue)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-700">Competitors</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {formatCurrency(competitorRevenue)}
          </div>
        </div>
      </div>

      {/* Market Dominance Indicator */}
      <div className="mt-3 pt-3 border-t">
        <div className="text-center">
          {tbwaShare >= 70 ? (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              🏆 Market Leader
            </Badge>
          ) : tbwaShare >= 50 ? (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              📈 Strong Position
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              🤝 Competitive Market
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default TBWACompetitiveToggle;