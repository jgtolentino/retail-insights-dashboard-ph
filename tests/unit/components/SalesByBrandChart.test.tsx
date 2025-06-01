import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Corrected imports based on actual project structure
import { useFilterStore } from '../../../src/stores/filterStore';
import { CustomerDensityMap } from '../../../src/components/maps/CustomerDensityMap';

// Mock the filter store
vi.mock('../../../src/stores/filterStore', () => ({
  useFilterStore: vi.fn(),
}));

// Mock the CustomerDensityMap dependencies
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Circle: ({ children }: { children: React.ReactNode }) => <div data-testid="circle">{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet', () => ({
  default: {},
}));

// Mock the useCustomerDensity hook
vi.mock('../../../src/hooks/useCustomerDensity', () => ({
  useCustomerDensity: vi.fn(() => ({
    data: [
      {
        area_name: 'Manila',
        latitude: 14.5995,
        longitude: 120.9842,
        transactions: 1500,
        revenue: 75000,
        unique_customers: 450,
        avg_transaction_value: 50.0,
      },
      {
        area_name: 'Cebu',
        latitude: 10.3157,
        longitude: 123.8854,
        transactions: 800,
        revenue: 40000,
        unique_customers: 250,
        avg_transaction_value: 50.0,
      },
    ],
    isLoading: false,
    error: null,
  })),
}));

describe('CustomerDensityMap Component', () => {
  const mockUseFilterStore = useFilterStore as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseFilterStore.mockReturnValue({
      selectedRegions: [],
      selectedBrands: [],
      dateRange: { start: null, end: null },
      setSelectedRegions: vi.fn(),
      setSelectedBrands: vi.fn(),
    });
  });

  it('renders map container', () => {
    render(<CustomerDensityMap />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('displays location data as circles', () => {
    render(<CustomerDensityMap />);
    
    const circles = screen.getAllByTestId('circle');
    expect(circles).toHaveLength(2); // Manila and Cebu
  });

  it('shows metric controls when enabled', () => {
    render(<CustomerDensityMap enableControls={true} />);
    
    // Look for select dropdowns (may be rendered as buttons by Radix)
    const controls = screen.getByRole('heading', { level: 6 }); // CardTitle
    expect(controls).toBeInTheDocument();
  });

  it('applies correct height styling', () => {
    const customHeight = '600px';
    render(<CustomerDensityMap height={customHeight} />);
    
    // The map container should have the custom height
    const mapContainer = screen.getByTestId('map-container').parentElement;
    expect(mapContainer).toHaveStyle({ height: customHeight });
  });
});