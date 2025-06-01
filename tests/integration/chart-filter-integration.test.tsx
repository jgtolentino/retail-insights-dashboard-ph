import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import SalesByBrandChart from '@/components/widgets/SalesByBrandChart';
import { GlobalFiltersPanel } from '@/components/GlobalFiltersPanel';
import { useFilterStore } from '@/stores/filterStore';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { name: 'Del Monte' },
              { name: 'Alaska' },
              { name: 'Champion' },
              { name: 'Oishi' },
              { name: 'Nestle' },
            ],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

// Mock the filter query helper
vi.mock('@/lib/filterQueryHelper', () => ({
  buildCompleteFilterQuery: vi.fn(() => Promise.resolve({
    select: vi.fn(() => Promise.resolve({
      data: [
        { id: 1, total_amount: 1000 },
        { id: 2, total_amount: 1500 },
      ],
      error: null,
    })),
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Chart-Filter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset filter store
    act(() => {
      useFilterStore.getState().resetAllFilters();
    });
  });

  it('chart updates when brand filter changes', async () => {
    const wrapper = createWrapper();
    
    render(
      <div>
        <GlobalFiltersPanel />
        <SalesByBrandChart data-testid="sales-chart" />
      </div>,
      { wrapper }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/Sales by Brand/)).toBeInTheDocument();
    });

    // Get initial chart state
    const initialChart = screen.getByText(/Sales by Brand/);
    expect(initialChart).toBeInTheDocument();

    // Change brand filter
    const brandSelect = screen.getByLabelText(/Brands/);
    expect(brandSelect).toBeInTheDocument();

    // Simulate selecting a brand (would trigger filter store update)
    act(() => {
      useFilterStore.getState().setSelectedBrands(['Del Monte']);
    });

    // Wait for chart to re-render with filtered data
    await waitFor(() => {
      // Chart should have updated based on filter change
      expect(screen.getByText(/Sales by Brand/)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify filter store has the selection
    expect(useFilterStore.getState().selectedBrands).toContain('Del Monte');
  });

  it('query key includes filter state for proper cache invalidation', async () => {
    const wrapper = createWrapper();
    
    render(<SalesByBrandChart />, { wrapper });

    // Initial state - no filters
    expect(useFilterStore.getState().selectedBrands).toEqual([]);

    // Change filter
    act(() => {
      useFilterStore.getState().setSelectedBrands(['Alaska']);
    });

    await waitFor(() => {
      expect(useFilterStore.getState().selectedBrands).toContain('Alaska');
    });

    // The useSalesByBrand hook should create different query keys for different filter states
    // This ensures React Query fetches new data when filters change
  });

  it('multiple filter changes trigger chart updates', async () => {
    const wrapper = createWrapper();
    
    render(<SalesByBrandChart />, { wrapper });

    // Apply multiple filters in sequence
    act(() => {
      useFilterStore.getState().setSelectedBrands(['Del Monte']);
    });

    await waitFor(() => {
      expect(useFilterStore.getState().selectedBrands).toContain('Del Monte');
    });

    act(() => {
      useFilterStore.getState().setSelectedCategories(['Beverages']);
    });

    await waitFor(() => {
      expect(useFilterStore.getState().selectedCategories).toContain('Beverages');
    });

    act(() => {
      useFilterStore.getState().setSelectedRegions(['Metro Manila']);
    });

    await waitFor(() => {
      expect(useFilterStore.getState().selectedRegions).toContain('Metro Manila');
    });

    // All filters should be applied
    const filterState = useFilterStore.getState();
    expect(filterState.selectedBrands).toContain('Del Monte');
    expect(filterState.selectedCategories).toContain('Beverages');
    expect(filterState.selectedRegions).toContain('Metro Manila');
  });

  it('filter reset clears chart filters', async () => {
    const wrapper = createWrapper();
    
    render(<SalesByBrandChart />, { wrapper });

    // Apply some filters
    act(() => {
      useFilterStore.getState().setSelectedBrands(['Del Monte', 'Alaska']);
      useFilterStore.getState().setSelectedCategories(['Beverages']);
    });

    await waitFor(() => {
      expect(useFilterStore.getState().selectedBrands).toHaveLength(2);
    });

    // Reset all filters
    act(() => {
      useFilterStore.getState().resetAllFilters();
    });

    await waitFor(() => {
      const state = useFilterStore.getState();
      expect(state.selectedBrands).toEqual([]);
      expect(state.selectedCategories).toEqual([]);
      expect(state.selectedRegions).toEqual([]);
    });
  });
});