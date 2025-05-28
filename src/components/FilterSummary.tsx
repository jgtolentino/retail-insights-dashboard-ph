import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { 
  ConsumerFilters, 
  ProductMixFilters, 
  getActiveFiltersCount, 
  getFilterSummary 
} from "@/types/filters";

interface FilterSummaryProps {
  filters: ConsumerFilters | ProductMixFilters;
  onClearAll: () => void;
  onClearFilter?: (filterType: string) => void;
  className?: string;
}

export function FilterSummary({ 
  filters, 
  onClearAll, 
  onClearFilter,
  className = ""
}: FilterSummaryProps) {
  const activeCount = getActiveFiltersCount(filters);
  const summary = getFilterSummary(filters);

  if (activeCount === 0) {
    return (
      <div className={`flex items-center text-sm text-muted-foreground ${className}`}>
        <Filter className="h-4 w-4 mr-2" />
        No filters applied
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <div className="flex items-center text-sm text-muted-foreground">
        <Filter className="h-4 w-4 mr-2" />
        Filters applied:
      </div>
      
      {(summary ?? []).map((item, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {item}
          {onClearFilter && (
            <X 
              className="ml-1 h-3 w-3 cursor-pointer" 
              onClick={() => onClearFilter(item.split(' ')[1])} // Extract filter type
            />
          )}
        </Badge>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  );
}