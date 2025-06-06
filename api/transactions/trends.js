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
    const { region, period = '7', brand, category } = req.query;

    // Get Supabase credentials
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // For now, return mock data since we need to check the actual schema
    // This structure matches what the frontend expects for transaction trends
    const mockTrends = {
      hourlyVolume: [
        { label: '00:00', transactionCount: 45, avgAmount: 285.50, timestamp: '2025-06-06T00:00:00Z' },
        { label: '01:00', transactionCount: 32, avgAmount: 312.75, timestamp: '2025-06-06T01:00:00Z' },
        { label: '02:00', transactionCount: 28, avgAmount: 298.25, timestamp: '2025-06-06T02:00:00Z' },
        { label: '03:00', transactionCount: 18, avgAmount: 275.80, timestamp: '2025-06-06T03:00:00Z' },
        { label: '04:00', transactionCount: 15, avgAmount: 290.45, timestamp: '2025-06-06T04:00:00Z' },
        { label: '05:00', transactionCount: 25, avgAmount: 315.60, timestamp: '2025-06-06T05:00:00Z' },
        { label: '06:00', transactionCount: 78, avgAmount: 345.25, timestamp: '2025-06-06T06:00:00Z' },
        { label: '07:00', transactionCount: 125, avgAmount: 378.90, timestamp: '2025-06-06T07:00:00Z' },
        { label: '08:00', transactionCount: 165, avgAmount: 425.75, timestamp: '2025-06-06T08:00:00Z' },
        { label: '09:00', transactionCount: 195, avgAmount: 465.30, timestamp: '2025-06-06T09:00:00Z' },
        { label: '10:00', transactionCount: 225, avgAmount: 485.65, timestamp: '2025-06-06T10:00:00Z' },
        { label: '11:00', transactionCount: 255, avgAmount: 512.40, timestamp: '2025-06-06T11:00:00Z' },
        { label: '12:00', transactionCount: 285, avgAmount: 545.80, timestamp: '2025-06-06T12:00:00Z' },
        { label: '13:00', transactionCount: 275, avgAmount: 535.25, timestamp: '2025-06-06T13:00:00Z' },
        { label: '14:00', transactionCount: 265, avgAmount: 520.90, timestamp: '2025-06-06T14:00:00Z' },
        { label: '15:00', transactionCount: 245, avgAmount: 498.75, timestamp: '2025-06-06T15:00:00Z' },
        { label: '16:00', transactionCount: 235, avgAmount: 485.30, timestamp: '2025-06-06T16:00:00Z' },
        { label: '17:00', transactionCount: 215, avgAmount: 465.85, timestamp: '2025-06-06T17:00:00Z' },
        { label: '18:00', transactionCount: 185, avgAmount: 445.60, timestamp: '2025-06-06T18:00:00Z' },
        { label: '19:00', transactionCount: 155, avgAmount: 415.25, timestamp: '2025-06-06T19:00:00Z' },
        { label: '20:00', transactionCount: 125, avgAmount: 385.90, timestamp: '2025-06-06T20:00:00Z' },
        { label: '21:00', transactionCount: 95, avgAmount: 355.45, timestamp: '2025-06-06T21:00:00Z' },
        { label: '22:00', transactionCount: 75, avgAmount: 325.80, timestamp: '2025-06-06T22:00:00Z' },
        { label: '23:00', transactionCount: 55, avgAmount: 295.65, timestamp: '2025-06-06T23:00:00Z' }
      ],
      summary: {
        totalTransactions: 3795,
        totalAmount: 1785675.50,
        avgTransaction: 470.85,
        peakHour: '12:00',
        peakTransactions: 285
      },
      filters: {
        region: region || 'All Regions',
        period: `${period} days`,
        brand: brand || 'All Brands',
        category: category || 'All Categories'
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'mock' // Will change to 'live' when connected to real data
    };

    // Apply basic filtering to mock data if filters are provided
    if (region && region !== 'All Regions') {
      // Adjust transaction counts based on region (simulation)
      mockTrends.hourlyVolume = mockTrends.hourlyVolume.map(hour => ({
        ...hour,
        transactionCount: Math.floor(hour.transactionCount * 0.6), // Simulate regional subset
        avgAmount: hour.avgAmount * 1.1 // Simulate regional price differences
      }));
      mockTrends.summary.totalTransactions = Math.floor(mockTrends.summary.totalTransactions * 0.6);
    }

    res.status(200).json(mockTrends);

  } catch (error) {
    console.error('Trends API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transaction trends',
      details: error.message 
    });
  }
}