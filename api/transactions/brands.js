import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { region, period = '7', category, limit = '10' } = req.query;

    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mock brand performance data
    const mockBrandData = {
      topBrands: [
        { brandName: 'Coca-Cola', revenue: 285675.50, transactionCount: 1245, averageTransaction: 229.46, marketShare: 18.5, category: 'Beverages' },
        { brandName: 'Unilever', revenue: 245890.75, transactionCount: 892, averageTransaction: 275.72, marketShare: 15.9, category: 'Personal Care' },
        { brandName: 'Nestlé', revenue: 198450.25, transactionCount: 756, averageTransaction: 262.50, marketShare: 12.8, category: 'Food & Snacks' },
        { brandName: 'P&G (Procter & Gamble)', revenue: 175625.80, transactionCount: 634, averageTransaction: 277.01, marketShare: 11.4, category: 'Household' },
        { brandName: 'San Miguel', revenue: 165875.60, transactionCount: 598, averageTransaction: 277.31, marketShare: 10.7, category: 'Beverages' },
        { brandName: 'Universal Robina', revenue: 142850.40, transactionCount: 512, averageTransaction: 279.00, marketShare: 9.2, category: 'Food & Snacks' },
        { brandName: 'Monde Nissin', revenue: 125675.30, transactionCount: 445, averageTransaction: 282.42, marketShare: 8.1, category: 'Food & Snacks' },
        { brandName: 'Century Pacific', revenue: 108925.75, transactionCount: 389, averageTransaction: 280.01, marketShare: 7.0, category: 'Canned Goods' },
        { brandName: 'Del Monte', revenue: 95450.85, transactionCount: 342, averageTransaction: 279.09, marketShare: 6.2, category: 'Food & Snacks' },
        { brandName: 'Emperador', revenue: 82675.95, transactionCount: 298, averageTransaction: 277.43, marketShare: 5.3, category: 'Beverages' }
      ],
      topSKUs: [
        { skuCode: 'CC-001', productName: 'Coca-Cola 350ml', brandName: 'Coca-Cola', revenue: 45750.25, unitsSold: 1525, unitPrice: 30.00, category: 'Beverages' },
        { skuCode: 'UN-045', productName: 'Dove Soap 100g', brandName: 'Unilever', revenue: 38950.60, unitsSold: 974, unitPrice: 40.00, category: 'Personal Care' },
        { skuCode: 'NE-089', productName: 'Maggi Noodles', brandName: 'Nestlé', revenue: 35675.80, unitsSold: 1427, unitPrice: 25.00, category: 'Food & Snacks' },
        { skuCode: 'PG-023', productName: 'Tide Powder 1kg', brandName: 'P&G', revenue: 32450.75, unitsSold: 649, unitPrice: 50.00, category: 'Household' },
        { skuCode: 'SM-156', productName: 'San Miguel Beer 330ml', brandName: 'San Miguel', revenue: 29875.40, unitsSold: 997, unitPrice: 30.00, category: 'Beverages' },
        { skuCode: 'UR-078', productName: 'Jack n Jill Chips', brandName: 'Universal Robina', revenue: 27650.95, unitsSold: 1383, unitPrice: 20.00, category: 'Food & Snacks' },
        { skuCode: 'MN-034', productName: 'Lucky Me Noodles', brandName: 'Monde Nissin', revenue: 25450.60, unitsSold: 1273, unitPrice: 20.00, category: 'Food & Snacks' },
        { skuCode: 'CP-067', productName: 'Century Tuna 155g', brandName: 'Century Pacific', revenue: 23875.85, unitsSold: 596, unitPrice: 40.00, category: 'Canned Goods' },
        { skuCode: 'DM-123', productName: 'Del Monte Juice 250ml', brandName: 'Del Monte', revenue: 22450.70, unitsSold: 898, unitPrice: 25.00, category: 'Beverages' },
        { skuCode: 'EM-045', productName: 'Emperador Brandy 350ml', brandName: 'Emperador', revenue: 21675.30, unitsSold: 217, unitPrice: 100.00, category: 'Beverages' }
      ],
      summary: {
        totalBrands: 45,
        totalRevenue: 1547125.15,
        totalTransactions: 6111,
        averageTransactionValue: 253.14,
        topCategory: 'Beverages',
        growthRate: '+12.5%'
      },
      categoryBreakdown: [
        { category: 'Beverages', revenue: 574426.45, share: 37.1, brandCount: 8 },
        { category: 'Food & Snacks', revenue: 462001.35, share: 29.9, brandCount: 12 },
        { category: 'Personal Care', revenue: 245890.75, share: 15.9, brandCount: 6 },
        { category: 'Household', revenue: 175625.80, share: 11.4, brandCount: 7 },
        { category: 'Canned Goods', revenue: 108925.75, share: 7.0, brandCount: 5 },
        { category: 'Others', revenue: 80255.05, share: 5.2, brandCount: 7 }
      ],
      filters: {
        region: region || 'All Regions',
        period: `${period} days`,
        category: category || 'All Categories',
        limit: parseInt(limit)
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'mock'
    };

    // Apply category filter if specified
    if (category && category !== 'All Categories') {
      mockBrandData.topBrands = mockBrandData.topBrands
        .filter(brand => brand.category.toLowerCase().includes(category.toLowerCase()))
        .slice(0, parseInt(limit));
      
      mockBrandData.topSKUs = mockBrandData.topSKUs
        .filter(sku => sku.category.toLowerCase().includes(category.toLowerCase()))
        .slice(0, parseInt(limit));
    } else {
      mockBrandData.topBrands = mockBrandData.topBrands.slice(0, parseInt(limit));
      mockBrandData.topSKUs = mockBrandData.topSKUs.slice(0, parseInt(limit));
    }

    res.status(200).json(mockBrandData);

  } catch (error) {
    console.error('Brands API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch brand data',
      details: error.message 
    });
  }
}