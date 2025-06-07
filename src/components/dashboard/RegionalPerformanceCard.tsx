import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Region {
  name: string;
  value: number;
  transactions: number;
  percentage: number;
  color: string;
  label: string;
}

const RegionalPerformanceCard: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  // Philippine regions mapping
  const regionConfig: Record<string, { color: string; label: string }> = {
    'NCR': { color: '#8b5cf6', label: 'National Capital Region' },
    'CAR': { color: '#3b82f6', label: 'Cordillera' },
    'Region I': { color: '#10b981', label: 'Ilocos Region' },
    'Region II': { color: '#f59e0b', label: 'Cagayan Valley' },
    'Region III': { color: '#ef4444', label: 'Central Luzon' },
    'CALABARZON': { color: '#6366f1', label: 'CALABARZON' },
    'MIMAROPA': { color: '#84cc16', label: 'MIMAROPA' },
    'Region V': { color: '#06b6d4', label: 'Bicol Region' },
    'Region VI': { color: '#ec4899', label: 'Western Visayas' },
    'Region VII': { color: '#f43f5e', label: 'Central Visayas' },
    'Region VIII': { color: '#a855f7', label: 'Eastern Visayas' },
    'Region IX': { color: '#22c55e', label: 'Zamboanga Peninsula' },
    'Region X': { color: '#0ea5e9', label: 'Northern Mindanao' },
    'Region XI': { color: '#f97316', label: 'Davao Region' },
    'Region XII': { color: '#7c3aed', label: 'SOCCSKSARGEN' },
    'CARAGA': { color: '#2563eb', label: 'Caraga' },
    'BARMM': { color: '#dc2626', label: 'Bangsamoro' }
  };

  useEffect(() => {
    fetchRegionalData();
    const interval = setInterval(fetchRegionalData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchRegionalData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fetch data with store location information
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          unit_price,
          total_price,
          transactions!inner(
            created_at,
            stores!inner(
              location,
              region
            )
          )
        `)
        .gte('transactions.created_at', today.toISOString());

      if (error) throw error;

      // Aggregate by region
      const regionPerformance: Record<string, any> = {};
      data?.forEach(transaction => {
        // Extract region from store location or use a default mapping
        const storeLocation = transaction.transactions?.stores?.location || 'Unknown';
        const region = transaction.transactions?.stores?.region || getRegionFromLocation(storeLocation);
        const value = transaction.total_price || 0;
        
        if (!regionPerformance[region]) {
          regionPerformance[region] = {
            name: region,
            value: 0,
            transactions: 0
          };
        }
        
        regionPerformance[region].value += value;
        regionPerformance[region].transactions += 1;
      });

      // Calculate max for scaling
      const maxValue = Math.max(...Object.values(regionPerformance).map((r: any) => r.value));

      // Sort and format regions
      const formattedRegions = Object.values(regionPerformance)
        .sort((a: any, b: any) => b.value - a.value)
        .map((region: any) => ({
          ...region,
          percentage: maxValue > 0 ? (region.value / maxValue) * 100 : 0,
          color: regionConfig[region.name]?.color || '#94a3b8',
          label: regionConfig[region.name]?.label || region.name
        }));

      setRegions(formattedRegions);
      setError(null);
    } catch (err) {
      console.error('Error fetching regional data:', err);
      setError('Unable to load regional data');
    } finally {
      setLoading(false);
    }
  };

  const getRegionFromLocation = (location: string): string => {
    // Simple mapping based on common city/province names
    const locationMappings: Record<string, string> = {
      'Manila': 'NCR',
      'Quezon City': 'NCR',
      'Makati': 'NCR',
      'Taguig': 'NCR',
      'Pasig': 'NCR',
      'Cebu': 'Region VII',
      'Davao': 'Region XI',
      'Iloilo': 'Region VI',
      'Cagayan de Oro': 'Region X',
      'Zamboanga': 'Region IX',
      'Baguio': 'CAR',
      'Angeles': 'Region III',
      'Batangas': 'CALABARZON',
      'Laguna': 'CALABARZON',
      'Cavite': 'CALABARZON'
    };

    // Check if location matches any known city/province
    for (const [city, region] of Object.entries(locationMappings)) {
      if (location.toLowerCase().includes(city.toLowerCase())) {
        return region;
      }
    }

    // Default to NCR if no match found
    return 'NCR';
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₱${(value / 1000).toFixed(0)}K`;
    }
    return `₱${value.toFixed(0)}`;
  };

  if (loading && regions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Regional Performance
        </h2>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Regional Performance
        </h2>
        <p className="text-red-500 text-sm">{error}</p>
        <button 
          onClick={fetchRegionalData}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        Regional Performance
      </h2>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {regions.slice(0, 8).map((region, index) => (
          <div 
            key={region.name}
            className="cursor-pointer"
            onClick={() => setSelectedRegion(region)}
            onMouseEnter={() => setSelectedRegion(region)}
            onMouseLeave={() => setSelectedRegion(null)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {region.label}
              </span>
              <span className="text-sm text-gray-600">
                {formatCurrency(region.value)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${region.percentage}%`,
                  backgroundColor: region.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {selectedRegion && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold">{selectedRegion.label}</p>
          <p className="text-xs text-gray-600">
            {selectedRegion.transactions} transactions • {formatCurrency(selectedRegion.value)}
          </p>
        </div>
      )}
    </div>
  );
};

export default RegionalPerformanceCard;