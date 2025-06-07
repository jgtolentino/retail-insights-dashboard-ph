import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Metrics {
  totalTransactions: number;
  totalValue: number;
  avgBasketSize: number;
  tbwaShare: number;
  trends: {
    transactions: number;
    value: number;
    basket: number;
    tbwa: number;
  };
}

const WhatsHappeningCard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalTransactions: 0,
    totalValue: 0,
    avgBasketSize: 0,
    tbwaShare: 0,
    trends: {
      transactions: 0,
      value: 0,
      basket: 0,
      tbwa: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch today's data from transaction_items table
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayData, error: todayError } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          products!inner(
            brands!inner(name, is_tbwa)
          ),
          transactions!inner(created_at)
        `)
        .gte('transactions.created_at', today.toISOString());

      if (todayError) throw todayError;

      // Calculate metrics
      const totalTransactions = todayData?.length || 0;
      const totalValue = todayData?.reduce((sum, t) => sum + (t.total_price || 0), 0) || 0;
      const avgBasketSize = totalTransactions > 0 ? totalValue / totalTransactions : 0;
      const tbwaTransactions = todayData?.filter(t => t.products?.brands?.is_tbwa).length || 0;
      const tbwaShare = totalTransactions > 0 ? (tbwaTransactions / totalTransactions) * 100 : 0;

      // Fetch yesterday's data for trends
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: yesterdayData } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          products!inner(
            brands!inner(name, is_tbwa)
          ),
          transactions!inner(created_at)
        `)
        .gte('transactions.created_at', yesterday.toISOString())
        .lt('transactions.created_at', today.toISOString());

      // Calculate trends
      const yesterdayTransactions = yesterdayData?.length || 0;
      const yesterdayValue = yesterdayData?.reduce((sum, t) => sum + (t.total_price || 0), 0) || 0;
      const yesterdayBasket = yesterdayTransactions > 0 ? yesterdayValue / yesterdayTransactions : 0;
      const yesterdayTbwa = yesterdayData?.filter(t => t.products?.brands?.is_tbwa).length || 0;
      const yesterdayTbwaShare = yesterdayTransactions > 0 ? (yesterdayTbwa / yesterdayTransactions) * 100 : 0;

      setMetrics({
        totalTransactions,
        totalValue,
        avgBasketSize,
        tbwaShare,
        trends: {
          transactions: yesterdayTransactions > 0 ? ((totalTransactions - yesterdayTransactions) / yesterdayTransactions) * 100 : 0,
          value: yesterdayValue > 0 ? ((totalValue - yesterdayValue) / yesterdayValue) * 100 : 0,
          basket: yesterdayBasket > 0 ? ((avgBasketSize - yesterdayBasket) / yesterdayBasket) * 100 : 0,
          tbwa: yesterdayTbwaShare > 0 ? ((tbwaShare - yesterdayTbwaShare) / yesterdayTbwaShare) * 100 : 0
        }
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Unable to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const TrendIndicator: React.FC<{ value: number }> = ({ value }) => {
    if (value === 0) return <span className="text-gray-500 text-sm">0%</span>;
    const isPositive = value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    return (
      <span className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <Icon className="w-3 h-3 mr-1" />
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  if (loading && !metrics.totalTransactions) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">What's Happening</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">What's Happening</h2>
        <p className="text-red-500 text-sm">{error}</p>
        <button 
          onClick={fetchMetrics}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">What's Happening</h2>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{metrics.totalTransactions}</span>
            <TrendIndicator value={metrics.trends.transactions} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Total Value</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatCurrency(metrics.totalValue)}</span>
            <TrendIndicator value={metrics.trends.value} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Basket Size</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatCurrency(metrics.avgBasketSize)}</span>
            <TrendIndicator value={metrics.trends.basket} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-600">TBWA Share</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-purple-600">{metrics.tbwaShare.toFixed(1)}%</span>
            <TrendIndicator value={metrics.trends.tbwa} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsHappeningCard;