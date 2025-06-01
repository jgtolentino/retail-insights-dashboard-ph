const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Simple Philippine brands
const brands = [
  { id: 1, name: 'Alaska Milk', category: 'dairy', is_tbwa: true },
  { id: 2, name: 'Oishi', category: 'snacks', is_tbwa: true },
  { id: 3, name: 'Champion', category: 'household', is_tbwa: true },
  { id: 4, name: 'Del Monte', category: 'food', is_tbwa: true },
  { id: 5, name: 'San Miguel', category: 'beverages', is_tbwa: true },
  { id: 6, name: 'Coca-Cola', category: 'beverages', is_tbwa: true },
  { id: 7, name: 'Jollibee', category: 'food', is_tbwa: false },
  { id: 8, name: 'Nestle', category: 'food', is_tbwa: false },
  { id: 9, name: 'Unilever', category: 'personal_care', is_tbwa: false },
  { id: 10, name: 'Procter & Gamble', category: 'personal_care', is_tbwa: false },
  { id: 11, name: 'Pepsi', category: 'beverages', is_tbwa: false },
  { id: 12, name: 'Bear Brand', category: 'dairy', is_tbwa: false },
  { id: 13, name: 'Kopiko', category: 'beverages', is_tbwa: false },
  { id: 14, name: 'Ricoa', category: 'food', is_tbwa: false },
  { id: 15, name: 'Magnolia', category: 'dairy', is_tbwa: false },
  { id: 16, name: 'Lucky Me', category: 'food', is_tbwa: false },
  { id: 17, name: 'Century Tuna', category: 'food', is_tbwa: false },
  { id: 18, name: 'Colgate', category: 'personal_care', is_tbwa: false },
  { id: 19, name: 'Head & Shoulders', category: 'personal_care', is_tbwa: false },
  { id: 20, name: 'Safeguard', category: 'personal_care', is_tbwa: false },
  { id: 21, name: 'Tide', category: 'household', is_tbwa: false },
  { id: 22, name: 'Ariel', category: 'household', is_tbwa: false },
  { id: 23, name: 'Downy', category: 'household', is_tbwa: false },
  { id: 24, name: 'Palmolive', category: 'personal_care', is_tbwa: false },
  { id: 25, name: 'Close Up', category: 'personal_care', is_tbwa: false },
  { id: 26, name: 'Gatorade', category: 'beverages', is_tbwa: false },
  { id: 27, name: 'Sprite', category: 'beverages', is_tbwa: false },
  { id: 28, name: 'Fanta', category: 'beverages', is_tbwa: false },
  { id: 29, name: 'Royal', category: 'beverages', is_tbwa: false },
  { id: 30, name: 'Tropicana', category: 'beverages', is_tbwa: false },
  { id: 31, name: 'Cream Silk', category: 'personal_care', is_tbwa: false },
  { id: 32, name: 'Pantene', category: 'personal_care', is_tbwa: false },
  { id: 33, name: 'Johnson\'s Baby', category: 'personal_care', is_tbwa: false },
  { id: 34, name: 'Lux', category: 'personal_care', is_tbwa: false },
  { id: 35, name: 'Dove', category: 'personal_care', is_tbwa: false },
  { id: 36, name: 'Knorr', category: 'food', is_tbwa: false },
  { id: 37, name: 'Maggi', category: 'food', is_tbwa: false },
  { id: 38, name: 'Milo', category: 'beverages', is_tbwa: false },
  { id: 39, name: 'Nescafe', category: 'beverages', is_tbwa: false },
  { id: 40, name: 'Ovaltine', category: 'beverages', is_tbwa: false },
  { id: 41, name: 'Bingo', category: 'snacks', is_tbwa: false },
  { id: 42, name: 'Jack n Jill', category: 'snacks', is_tbwa: false },
  { id: 43, name: 'Piattos', category: 'snacks', is_tbwa: false },
  { id: 44, name: 'Nova', category: 'snacks', is_tbwa: false },
  { id: 45, name: 'Rebisco', category: 'snacks', is_tbwa: false },
  { id: 46, name: 'Richeese', category: 'snacks', is_tbwa: false },
  { id: 47, name: 'Skyflakes', category: 'snacks', is_tbwa: false },
  { id: 48, name: 'Monde', category: 'snacks', is_tbwa: false },
  { id: 49, name: 'Hansel', category: 'snacks', is_tbwa: false },
  { id: 50, name: 'Chippy', category: 'snacks', is_tbwa: false }
];

// Simple stores
const stores = [
  { id: 1, name: 'SM Mall Manila', location: 'Manila', region: 'NCR', city: 'Manila', latitude: 14.5995, longitude: 120.9842 },
  { id: 2, name: 'SM Megamall', location: 'Ortigas', region: 'NCR', city: 'Mandaluyong', latitude: 14.5873, longitude: 121.0615 },
  { id: 3, name: 'Ayala Makati', location: 'Makati', region: 'NCR', city: 'Makati', latitude: 14.5547, longitude: 121.0244 },
  { id: 4, name: 'Robinsons Galleria', location: 'Quezon City', region: 'NCR', city: 'Quezon City', latitude: 14.6285, longitude: 121.0559 },
  { id: 5, name: 'SM City Cebu', location: 'Cebu City', region: 'Region VII', city: 'Cebu City', latitude: 10.3157, longitude: 123.8854 },
  { id: 6, name: 'Ayala Center Cebu', location: 'Cebu City', region: 'Region VII', city: 'Cebu City', latitude: 10.3181, longitude: 123.8998 },
  { id: 7, name: 'SM Lanang Davao', location: 'Davao City', region: 'Region XI', city: 'Davao City', latitude: 7.1074, longitude: 125.6220 },
  { id: 8, name: 'Abreeza Mall', location: 'Davao City', region: 'Region XI', city: 'Davao City', latitude: 7.0731, longitude: 125.6128 }
];

async function createFreshData() {
  console.log('🚀 Creating fresh complete dataset...');
  
  try {
    // Clear existing data first
    console.log('🗑️ Clearing existing data...');
    await supabase.from('brands').delete().neq('id', 0);
    await supabase.from('stores').delete().neq('id', 0);
    
    // Insert brands
    console.log('📋 Inserting 50 brands...');
    const { error: brandsError } = await supabase.from('brands').insert(brands);
    if (brandsError) {
      console.error('Error inserting brands:', brandsError);
      return;
    }
    
    // Insert stores
    console.log('🏪 Inserting stores...');
    const { error: storesError } = await supabase.from('stores').insert(stores);
    if (storesError) {
      console.error('Error inserting stores:', storesError);
      return;
    }
    
    console.log('✅ SUCCESS: Created fresh dataset with 50 brands and 8 stores!');
    console.log('📊 You should now see 50 brands in the filter dropdown');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createFreshData();