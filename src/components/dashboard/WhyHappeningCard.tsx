import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Driver {
  name: string;
  value: number;
  transactions: number;
  rank: number;
  impact: number;
  explanation: string;
}

const WhyHappeningCard: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDriver, setHoveredDriver] = useState<number | null>(null);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      
      // Fetch today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          products!inner(
            name,
            category,
            brands!inner(name, category)
          ),
          transactions!inner(created_at)
        `)
        .gte('transactions.created_at', today.toISOString());

      if (error) throw error;

      // Aggregate by product category
      const categoryPerformance: Record<string, any> = {};
      data?.forEach(transaction => {
        const category = transaction.products?.category || 'Uncategorized';
        const value = transaction.total_price || 0;
        
        if (!categoryPerformance[category]) {
          categoryPerformance[category] = {
            name: category,
            value: 0,
            transactions: 0,
            topProduct: null
          };
        }
        
        categoryPerformance[category].value += value;
        categoryPerformance[category].transactions += 1;
      });

      // Calculate total value for impact calculation
      const totalValue = data?.reduce((sum, t) => sum + (t.total_price || 0), 0) || 0;

      // Sort and get top 3 drivers
      const topDrivers = Object.values(categoryPerformance)
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 3)
        .map((driver: any, index) => ({
          ...driver,
          rank: index + 1,
          impact: totalValue > 0 ? (driver.value / totalValue) * 100 : 0,
          explanation: getDriverExplanation(driver)
        }));

      setDrivers(topDrivers);
      setError(null);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Unable to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const getDriverExplanation = (driver: any): string => {
    const explanations: Record<string, string> = {
      'Electronics': 'High-value items and seasonal gadget launches driving growth',
      'Groceries': 'Daily essentials maintaining steady transaction volume',
      'Fashion': 'New collection launches and promotional campaigns',
      'Home & Living': 'Furniture and appliance sales contributing to basket size',
      'Beauty': 'Premium skincare and makeup products gaining traction',
      'Beverages': 'Soft drinks and energy drinks popular during peak hours',
      'Snacks': 'Impulse purchases and promotional bundle deals',
      'Personal Care': 'Health and hygiene products with consistent demand'
    };
    
    return explanations[driver.name] || `${driver.transactions} transactions contributing to performance`;
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₱${(value / 1000).toFixed(0)}K`;
    }
    return `₱${value.toFixed(0)}`;
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Why It's Happening</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Why It's Happening</h2>
        <p className="text-red-500 text-sm">{error}</p>
        <button 
          onClick={fetchDrivers}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Why It's Happening</h2>
      
      <div className="space-y-3">
        {drivers.map((driver) => (
          <div 
            key={driver.rank}
            className="relative p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onMouseEnter={() => setHoveredDriver(driver.rank)}
            onMouseLeave={() => setHoveredDriver(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-400">#{driver.rank}</span>
                <div>
                  <p className="font-semibold text-gray-900">{driver.name}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(driver.value)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-purple-600">{driver.impact.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">impact</p>
                </div>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            {hoveredDriver === driver.rank && (
              <div className="absolute z-10 mt-2 p-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs">
                {driver.explanation}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-xs text-gray-500 text-center">
        Top 3 categories driving today's performance
      </p>
    </div>
  );
};

export default WhyHappeningCard;