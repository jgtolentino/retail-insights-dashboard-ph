import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectProps {
  label: string;
  options: FilterOption[];
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  showCount?: boolean;
  maxDisplayed?: number;
}

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  className,
  disabled = false,
  showCount = true,
  maxDisplayed = 3,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      // If all filtered options are selected, clear all
      onChange([]);
    } else {
      // Select all filtered options
      const allValues = filteredOptions.map(option => option.value);
      const newValue = [...new Set([...value, ...allValues])];
      onChange(newValue);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleRemoveItem = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const getDisplayText = () => {
    if (value.length === 0) {
      return placeholder;
    }

    if (value.length <= maxDisplayed) {
      return value.map(v => options.find(opt => opt.value === v)?.label || v).join(', ');
    }

    const firstItems = value
      .slice(0, maxDisplayed)
      .map(v => options.find(opt => opt.value === v)?.label || v)
      .join(', ');

    return `${firstItems} +${value.length - maxDisplayed} more`;
  };

  const selectedCount = value.length;
  const allFilteredSelected =
    filteredOptions.length > 0 && filteredOptions.every(option => value.includes(option.value));

  return (
    <div className={cn('relative', className)}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {showCount && selectedCount > 0 && (
          <span className="ml-1 text-xs text-gray-500">({selectedCount})</span>
        )}
      </label>

      <Button
        ref={buttonRef}
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full justify-between text-left font-normal',
          selectedCount > 0 && 'text-black',
          selectedCount === 0 && 'text-gray-500'
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
        />
      </Button>

      {/* Selected items as badges */}
      {selectedCount > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {value.slice(0, maxDisplayed).map(selectedValue => {
            const option = options.find(opt => opt.value === selectedValue);
            return (
              <Badge
                key={selectedValue}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                {option?.label || selectedValue}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={e => handleRemoveItem(selectedValue, e)}
                />
              </Badge>
            );
          })}
          {selectedCount > maxDisplayed && (
            <Badge variant="outline" className="text-xs">
              +{selectedCount - maxDisplayed} more
            </Badge>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {/* Search and controls */}
          <div className="border-b border-gray-100 p-2">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-6 px-2 text-xs"
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs"
                disabled={selectedCount === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      'flex cursor-pointer items-center justify-between p-2 hover:bg-gray-50',
                      isSelected && 'bg-blue-50'
                    )}
                    onClick={() => handleToggleOption(option.value)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border border-gray-300',
                          isSelected && 'border-blue-600 bg-blue-600'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm">{option.label}</span>
                    </div>
                    {option.count !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
