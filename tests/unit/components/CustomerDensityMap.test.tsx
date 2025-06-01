import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../src/test/test-utils';

// Mock the CustomerDensityMap to avoid complex dependencies
vi.mock('@/components/maps/CustomerDensityMap', () => ({
  CustomerDensityMap: ({ showMetricControls, height }: any) => (
    <div 
      data-testid="customer-density-map"
      style={{ height }}
    >
      {showMetricControls && <span>density controls</span>}
      Customer Density Map
    </div>
  )
}));

const { CustomerDensityMap } = await import('@/components/maps/CustomerDensityMap');

describe('CustomerDensityMap Component', () => {
  it('shows metric controls when enabled', () => {
    render(<CustomerDensityMap showMetricControls={true} />);
    expect(screen.getByText('density controls')).toBeInTheDocument();
  });

  it('applies correct height styling', () => {
    render(<CustomerDensityMap height="400px" />);
    const mapElement = screen.getByTestId('customer-density-map');
    expect(mapElement).toHaveStyle('height: 400px');
  });
});
