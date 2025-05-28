import * as React from "react";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[] | undefined;
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplayedTags?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  maxDisplayedTags = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  
  // Ensure selected is always an array
  const safeSelected = selected || [];

  const handleUnselect = (value: string) => {
    onChange((safeSelected ?? []).filter((item) => item !== value));
  };

  const handleSelectAll = () => {
    onChange((options ?? []).map((option) => option.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const selectedOptions = (options ?? []).filter((option) => 
    (safeSelected || []).includes(option.value)
  );

  const displayedTags = selectedOptions.slice(0, maxDisplayedTags);
  const remainingCount = (selectedOptions?.length ?? 0) - maxDisplayedTags;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto",
            className
          )}
        >
          <div className="flex gap-1 flex-wrap">
            {(safeSelected?.length ?? 0) === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {(displayedTags ?? []).map((option) => (
                  <Badge
                    variant="secondary"
                    key={option.value}
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(option.value);
                    }}
                  >
                    {option.label}
                    <X className="ml-1 h-3 w-3 cursor-pointer" />
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="outline" className="mr-1 mb-1">
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandGroup>
            {/* Select All / Clear All buttons */}
            <div className="flex justify-between px-2 py-1 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={safeSelected.length === options.length}
                className="h-8 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={safeSelected.length === 0}
                className="h-8 text-xs"
              >
                Clear All
              </Button>
            </div>
            
            {(options ?? []).map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  const newSelected = (safeSelected || []).includes(option.value)
                    ? (safeSelected ?? []).filter((item) => item !== option.value)
                    : [...safeSelected, option.value];
                  onChange(newSelected);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    (safeSelected || []).includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}