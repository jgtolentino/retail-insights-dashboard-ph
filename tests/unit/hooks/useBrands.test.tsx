import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBrands, useAllBrands } from '@/hooks/useBrands';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBrands Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches unique brand names from Supabase', async () => {
    const mockBrands = [
      { name: 'Del Monte' },
      { name: 'Alaska' },
      { name: 'Champion' },
      { name: 'Del Monte' }, // Duplicate to test deduplication
      { name: 'Oishi' },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockBrands,
            error: null,
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBrands(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(['Del Monte', 'Alaska', 'Champion', 'Oishi']);
    expect(mockFrom).toHaveBeenCalledWith('brands');
  });

  it('handles empty brand data gracefully', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBrands(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('handles Supabase errors properly', async () => {
    const mockError = new Error('Database connection failed');
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBrands(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(mockError);
  });

  it('filters out null and empty brand names', async () => {
    const mockBrands = [
      { name: 'Del Monte' },
      { name: null },
      { name: '' },
      { name: 'Alaska' },
      { name: undefined },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockBrands,
            error: null,
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBrands(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(['Del Monte', 'Alaska']);
  });

  it('returns more than 4 brands to prove dynamic loading', async () => {
    const mockBrands = [
      { name: 'Del Monte' },
      { name: 'Alaska' },
      { name: 'Champion' },
      { name: 'Oishi' },
      { name: 'Marlboro' },
      { name: 'UFC' },
      { name: 'Nestle' },
      { name: 'San Miguel' },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockBrands,
            error: null,
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBrands(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // This proves we're not using the old hardcoded 4-brand array
    expect(result.current.data).toHaveLength(8);
    expect(result.current.data?.length).toBeGreaterThan(4);
  });
});

describe('useAllBrands Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches brands with id and name', async () => {
    const mockBrands = [
      { id: 1, name: 'Del Monte' },
      { id: 2, name: 'Alaska' },
    ];

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockBrands,
            error: null,
          }),
        }),
      }),
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAllBrands(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockBrands);
  });
});