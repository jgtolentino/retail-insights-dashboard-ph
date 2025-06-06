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
    const { region, period = '7' } = req.query;

    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mock heatmap data for Philippines stores
    const mockHeatmap = {
      locations: [
        // Metro Manila
        { id: 1, storeName: 'Sari-Sari Store Manila #1', latitude: 14.5995, longitude: 120.9842, transactionCount: 285, totalAmount: 142850.75, region: 'Metro Manila', city: 'Manila' },
        { id: 2, storeName: 'Quick Shop Quezon City', latitude: 14.6760, longitude: 121.0437, transactionCount: 312, totalAmount: 165875.50, region: 'Metro Manila', city: 'Quezon City' },
        { id: 3, storeName: 'Neighborhood Store Makati', latitude: 14.5547, longitude: 121.0244, transactionCount: 198, totalAmount: 98450.25, region: 'Metro Manila', city: 'Makati' },
        { id: 4, storeName: 'Corner Store Pasig', latitude: 14.5764, longitude: 121.0851, transactionCount: 245, totalAmount: 128675.80, region: 'Metro Manila', city: 'Pasig' },
        
        // Cebu
        { id: 5, storeName: 'Cebu Central Store', latitude: 10.3157, longitude: 123.8854, transactionCount: 225, totalAmount: 118925.60, region: 'Central Visayas', city: 'Cebu City' },
        { id: 6, storeName: 'Island Store Lapu-Lapu', latitude: 10.3103, longitude: 123.9494, transactionCount: 165, totalAmount: 85750.40, region: 'Central Visayas', city: 'Lapu-Lapu' },
        
        // Davao
        { id: 7, storeName: 'Davao Downtown Store', latitude: 7.0731, longitude: 125.6128, transactionCount: 195, totalAmount: 102850.75, region: 'Davao Region', city: 'Davao City' },
        { id: 8, storeName: 'Mindanao Market Store', latitude: 7.0644, longitude: 125.6081, transactionCount: 178, totalAmount: 94675.30, region: 'Davao Region', city: 'Davao City' },
        
        // Baguio
        { id: 9, storeName: 'Mountain View Store', latitude: 16.4023, longitude: 120.5960, transactionCount: 155, totalAmount: 82450.95, region: 'Cordillera', city: 'Baguio' },
        
        // Iloilo
        { id: 10, storeName: 'Iloilo City Center', latitude: 10.7202, longitude: 122.5621, transactionCount: 185, totalAmount: 96275.85, region: 'Western Visayas', city: 'Iloilo City' },
        
        // Cagayan de Oro
        { id: 11, storeName: 'CDO River Store', latitude: 8.4542, longitude: 124.6319, transactionCount: 142, totalAmount: 75850.60, region: 'Northern Mindanao', city: 'Cagayan de Oro' },
        
        // Additional Metro Manila stores
        { id: 12, storeName: 'Taguig BGC Store', latitude: 14.5176, longitude: 121.0509, transactionCount: 267, totalAmount: 145725.40, region: 'Metro Manila', city: 'Taguig' },
        { id: 13, storeName: 'Alabang Store', latitude: 14.4222, longitude: 121.0412, transactionCount: 189, totalAmount: 99850.25, region: 'Metro Manila', city: 'Muntinlupa' },
        { id: 14, storeName: 'Marikina Heights Store', latitude: 14.6507, longitude: 121.1029, transactionCount: 156, totalAmount: 82450.90, region: 'Metro Manila', city: 'Marikina' },
        { id: 15, storeName: 'Parañaque Store', latitude: 14.4793, longitude: 121.0198, transactionCount: 203, totalAmount: 108675.75, region: 'Metro Manila', city: 'Parañaque' }
      ],
      summary: {
        totalStores: 15,
        totalTransactions: 3195,
        totalAmount: 1695875.85,
        averagePerStore: 213,
        topPerformingStore: 'Quick Shop Quezon City',
        topPerformingRegion: 'Metro Manila'
      },
      filters: {
        region: region || 'All Regions',
        period: `${period} days`
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'mock'
    };

    // Filter by region if specified
    if (region && region !== 'All Regions') {
      mockHeatmap.locations = mockHeatmap.locations.filter(store => 
        store.region.toLowerCase().includes(region.toLowerCase())
      );
      
      // Recalculate summary for filtered data
      const filteredTransactions = mockHeatmap.locations.reduce((sum, store) => sum + store.transactionCount, 0);
      const filteredAmount = mockHeatmap.locations.reduce((sum, store) => sum + store.totalAmount, 0);
      
      mockHeatmap.summary = {
        ...mockHeatmap.summary,
        totalStores: mockHeatmap.locations.length,
        totalTransactions: filteredTransactions,
        totalAmount: filteredAmount,
        averagePerStore: Math.round(filteredTransactions / mockHeatmap.locations.length)
      };
    }

    res.status(200).json(mockHeatmap);

  } catch (error) {
    console.error('Heatmap API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch heatmap data',
      details: error.message 
    });
  }
}