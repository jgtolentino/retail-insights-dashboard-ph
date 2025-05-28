
import Select, { MultiValue } from 'react-select';
import { useGlobalFilters } from '@/contexts/FilterContext';
import { 
  CATEGORY_OPTIONS, 
  BRAND_OPTIONS, 
  PRODUCT_OPTIONS, 
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  LOCATION_OPTIONS,
  INCOME_RANGE_OPTIONS 
} from '@/types/filters';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface Option {
  label: string;
  value: string;
}

const toSelectValue = (values: string[]): Option[] => 
  values.map(value => ({ label: value, value }));

const fromSelectValue = (options: MultiValue<Option>): string[] =>
  options.map(option => option.value);

export function GlobalFiltersPanel() {
  const { globalFilters, updateGlobalFilters, resetGlobalFilters } = useGlobalFilters();
  const [isDateOpen, setIsDateOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined, type: 'start' | 'end') => {
    if (date) {
      updateGlobalFilters({
        [type === 'start' ? 'startDate' : 'endDate']: date
      });
    }
  };

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '38px',
      fontSize: '14px',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#e0e7ff',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#3730a3',
      fontSize: '12px',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#3730a3',
      ':hover': {
        backgroundColor: '#c7d2fe',
        color: '#312e81',
      },
    }),
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Date Range */}
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(globalFilters.startDate, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={globalFilters.startDate}
                  onSelect={(date) => handleDateSelect(date, 'start')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(globalFilters.endDate, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={globalFilters.endDate}
                  onSelect={(date) => handleDateSelect(date, 'end')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Categories */}
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories
          </label>
          <Select
            isMulti
            options={CATEGORY_OPTIONS}
            value={toSelectValue(globalFilters.categories)}
            onChange={(options) => 
              updateGlobalFilters({ categories: fromSelectValue(options) })
            }
            placeholder="All categories..."
            styles={customSelectStyles}
            className="text-sm"
          />
        </div>

        {/* Brands */}
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brands
          </label>
          <Select
            isMulti
            options={BRAND_OPTIONS}
            value={toSelectValue(globalFilters.brands)}
            onChange={(options) => 
              updateGlobalFilters({ brands: fromSelectValue(options) })
            }
            placeholder="All brands..."
            styles={customSelectStyles}
            className="text-sm"
          />
        </div>

        {/* Products */}
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Products
          </label>
          <Select
            isMulti
            options={PRODUCT_OPTIONS}
            value={toSelectValue(globalFilters.products)}
            onChange={(options) => 
              updateGlobalFilters({ products: fromSelectValue(options) })
            }
            placeholder="All products..."
            styles={customSelectStyles}
            className="text-sm"
          />
        </div>

        {/* Age Groups */}
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age Groups
          </label>
          <Select
            isMulti
            options={AGE_GROUP_OPTIONS}
            value={toSelectValue(globalFilters.ageGroups)}
            onChange={(options) => 
              updateGlobalFilters({ ageGroups: fromSelectValue(options) })
            }
            placeholder="All ages..."
            styles={customSelectStyles}
            className="text-sm"
          />
        </div>

        {/* Genders */}
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <Select
            isMulti
            options={GENDER_OPTIONS}
            value={toSelectValue(globalFilters.genders)}
            onChange={(options) => 
              updateGlobalFilters({ genders: fromSelectValue(options) })
            }
            placeholder="All genders..."
            styles={customSelectStyles}
            className="text-sm"
          />
        </div>

        {/* Reset Button */}
        <Button
          onClick={resetGlobalFilters}
          variant="outline"
          size="sm"
          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset All
        </Button>
      </div>
    </div>
  );
}
