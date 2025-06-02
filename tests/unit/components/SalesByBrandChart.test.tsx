// tests/unit/components/SalesByBrandChart.test.tsx
import { render, screen } from '@testing-library/react';
import SalesByBrandChart from '@/components/charts/SalesByBrandChart';

describe('SalesByBrandChart', () => {
  it('renders placeholder', () => {
    render(<SalesByBrandChart />);
    expect(screen.getByText(/Sales by Brand Chart/i)).toBeInTheDocument();
  });
}); 