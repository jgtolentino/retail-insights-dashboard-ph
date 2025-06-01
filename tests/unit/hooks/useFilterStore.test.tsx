import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useFilterStore } from '../../../src/stores/filterStore';

describe('useFilterStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFilterStore.getState().resetAllFilters();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFilterStore());

    expect(result.current.selectedBrands).toEqual([]);
    expect(result.current.selectedCategories).toEqual([]);
    expect(result.current.selectedRegions).toEqual([]);
    expect(result.current.dateRange).toEqual({ start: null, end: null });
  });

  it('should update selected brands', () => {
    const { result } = renderHook(() => useFilterStore());

    act(() => {
      result.current.setSelectedBrands(['Brand A', 'Brand B']);
    });

    expect(result.current.selectedBrands).toEqual(['Brand A', 'Brand B']);
  });

  it('should update date range', () => {
    const { result } = renderHook(() => useFilterStore());
    const dateRange = { start: '2024-01-01', end: '2024-01-31' };

    act(() => {
      result.current.setDateRange(dateRange);
    });

    expect(result.current.dateRange).toEqual(dateRange);
  });

  it('should count active filters correctly', () => {
    const { result } = renderHook(() => useFilterStore());

    // No filters initially
    expect(result.current.getActiveFiltersCount()).toBe(0);

    // Add some filters
    act(() => {
      result.current.setSelectedBrands(['Brand A']);
      result.current.setSelectedCategories(['Category 1']);
      result.current.setDateRange({ start: '2024-01-01', end: '2024-01-31' });
    });

    expect(result.current.getActiveFiltersCount()).toBe(3);
  });

  it('should reset all filters', () => {
    const { result } = renderHook(() => useFilterStore());

    // Set some filters
    act(() => {
      result.current.setSelectedBrands(['Brand A']);
      result.current.setSelectedCategories(['Category 1']);
      result.current.setDateRange({ start: '2024-01-01', end: '2024-01-31' });
    });

    // Reset
    act(() => {
      result.current.resetAllFilters();
    });

    expect(result.current.selectedBrands).toEqual([]);
    expect(result.current.selectedCategories).toEqual([]);
    expect(result.current.dateRange).toEqual({ start: null, end: null });
    expect(result.current.getActiveFiltersCount()).toBe(0);
  });

  it('should generate filter summary correctly', () => {
    const { result } = renderHook(() => useFilterStore());

    act(() => {
      result.current.setSelectedBrands(['Brand A', 'Brand B']);
      result.current.setSelectedCategories(['Category 1']);
      result.current.setDateRange({ start: '2024-01-01', end: '2024-01-31' });
    });

    const summary = result.current.getFilterSummary();
    expect(summary).toContain('Date: 2024-01-01 to 2024-01-31');
    expect(summary).toContain('2 brands');
    expect(summary).toContain('1 categories');
  });
});