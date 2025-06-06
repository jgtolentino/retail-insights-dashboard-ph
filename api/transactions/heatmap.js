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
    const { region = 'All Regions', period = 7, metric = 'transactions' } = req.query;

    // Mock geospatial data for Philippine sari-sari stores
    const storeLocations = [
      // Metro Manila
      { id: 'MM001', name: 'Tindahan ni Aling Rosa', lat: 14.5995, lng: 120.9842, city: 'Manila', region: 'NCR' },
      { id: 'MM002', name: 'Kuya Jun Store', lat: 14.6760, lng: 121.0437, city: 'Quezon City', region: 'NCR' },
      { id: 'MM003', name: 'Nanay Beth Variety Store', lat: 14.5547, lng: 121.0244, city: 'Makati', region: 'NCR' },
      { id: 'MM004', name: 'Mang Tonio Sari-Sari', lat: 14.5378, lng: 121.0014, city: 'Pasig', region: 'NCR' },
      { id: 'MM005', name: 'Ate Luz Mini Mart', lat: 14.6507, lng: 121.0617, city: 'Marikina', region: 'NCR' },
      
      // Cebu
      { id: 'CB001', name: 'Lola Nena Store', lat: 10.3157, lng: 123.8854, city: 'Cebu City', region: 'Central Visayas' },
      { id: 'CB002', name: 'Tito Boy Mini Store', lat: 10.2897, lng: 123.9016, city: 'Lapu-Lapu', region: 'Central Visayas' },
      { id: 'CB003', name: 'Manang Dolor Store', lat: 10.3312, lng: 123.9133, city: 'Mandaue', region: 'Central Visayas' },
      
      // Davao
      { id: 'DV001', name: 'Kuya Dodong Store', lat: 7.0731, lng: 125.6128, city: 'Davao City', region: 'Davao Region' },
      { id: 'DV002', name: 'Ate Grace Variety', lat: 7.0644, lng: 125.6078, city: 'Davao City', region: 'Davao Region' },
      
      // Baguio
      { id: 'BG001', name: 'Manong Eddie Store', lat: 16.4023, lng: 120.5960, city: 'Baguio', region: 'CAR' },
      { id: 'BG002', name: 'Aling Linda Mini Mart', lat: 16.4122, lng: 120.5937, city: 'Baguio', region: 'CAR' },
      
      // Iloilo
      { id: 'IL001', name: 'Tatay Rodel Store', lat: 10.7202, lng: 122.5621, city: 'Iloilo City', region: 'Western Visayas' },
      { id: 'IL002', name: 'Nanay Carmen Store', lat: 10.6958, lng: 122.5739, city: 'Iloilo City', region: 'Western Visayas' },
      
      // Cagayan de Oro
      { id: 'CO001', name: 'Tito Ben Sari-Sari', lat: 8.4542, lng: 124.6319, city: 'Cagayan de Oro', region: 'Northern Mindanao' },
    ];

    // Generate realistic performance data for each store
    const generateStoreData = (store) => {
      const baseTransactions = Math.floor(Math.random() * 500) + 200; // 200-700 transactions
      const baseRevenue = baseTransactions * (Math.random() * 100 + 50); // ₱50-150 avg per transaction
      
      // Regional multipliers for realistic variations
      const regionMultipliers = {
        'NCR': 1.3, // Metro Manila has higher activity
        'Central Visayas': 1.1,
        'Davao Region': 1.0,
        'CAR': 0.8, // Baguio is smaller
        'Western Visayas': 0.9,
        'Northern Mindanao': 0.85
      };
      
      const multiplier = regionMultipliers[store.region] || 1.0;
      
      return {
        ...store,
        transactions: Math.floor(baseTransactions * multiplier),
        revenue: Math.floor(baseRevenue * multiplier),
        averageTransaction: Math.floor((baseRevenue * multiplier) / (baseTransactions * multiplier)),
        customerFootfall: Math.floor((baseTransactions * multiplier) * 1.3), // More customers than transactions
        peakHours: ['9:00 AM', '12:00 PM', '6:00 PM'],
        topProducts: ['Instant noodles', 'Soft drinks', 'Rice', 'Snacks', 'Toiletries'],
        deviceStatus: Math.random() > 0.1 ? 'online' : 'offline', // 90% online
        lastSync: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
        coordinates: [store.lng, store.lat], // GeoJSON format
        intensity: Math.min(Math.floor((baseTransactions * multiplier) / 50), 10), // 1-10 intensity scale
      };
    };

    const heatmapData = storeLocations
      .map(generateStoreData)
      .filter(store => region === 'All Regions' || store.region === region);

    // Calculate summary statistics
    const totalTransactions = heatmapData.reduce((sum, store) => sum + store.transactions, 0);
    const totalRevenue = heatmapData.reduce((sum, store) => sum + store.revenue, 0);
    const avgTransactionsPerStore = Math.floor(totalTransactions / heatmapData.length);
    const avgRevenuePerStore = Math.floor(totalRevenue / heatmapData.length);
    
    // Find top performing stores
    const topStores = heatmapData
      .sort((a, b) => {
        if (metric === 'revenue') return b.revenue - a.revenue;
        return b.transactions - a.transactions;
      })
      .slice(0, 5);

    const response = {
      storeData: heatmapData,
      summary: {
        totalStores: heatmapData.length,
        totalTransactions,
        totalRevenue,
        avgTransactionsPerStore,
        avgRevenuePerStore,
        onlineDevices: heatmapData.filter(s => s.deviceStatus === 'online').length,
        offlineDevices: heatmapData.filter(s => s.deviceStatus === 'offline').length,
        topStores,
      },
      mapBounds: {
        north: Math.max(...heatmapData.map(s => s.lat)) + 0.1,
        south: Math.min(...heatmapData.map(s => s.lat)) - 0.1,
        east: Math.max(...heatmapData.map(s => s.lng)) + 0.1,
        west: Math.min(...heatmapData.map(s => s.lng)) - 0.1,
      },
      filters: {
        region,
        period: `${period} days`,
        metric,
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'Project Scout IoT Network - Philippine Sari-Sari Stores',
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in heatmap API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch heatmap data',
      details: error.message
    });
  }
}