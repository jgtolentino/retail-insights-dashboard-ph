const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Comprehensive TBWA client brands and competitors
const brands = [
  // TBWA CLIENT: Alaska Milk Corporation (Dairy)
  { id: 1, name: 'Alaska Evaporated Milk', category: 'dairy', is_tbwa: true },
  { id: 2, name: 'Alaska Condensed Milk', category: 'dairy', is_tbwa: true },
  { id: 3, name: 'Alaska Powdered Milk', category: 'dairy', is_tbwa: true },
  { id: 4, name: 'Krem-Top Coffee Creamer', category: 'dairy', is_tbwa: true },
  { id: 5, name: 'Alpine Evaporated Milk', category: 'dairy', is_tbwa: true },
  { id: 6, name: 'Alpine Condensed Milk', category: 'dairy', is_tbwa: true },
  { id: 7, name: 'Cow Bell Powdered Milk', category: 'dairy', is_tbwa: true },

  // TBWA CLIENT: Oishi/Liwayway (Snacks)
  { id: 8, name: 'Oishi Prawn Crackers', category: 'snacks', is_tbwa: true },
  { id: 9, name: 'Oishi Pillows', category: 'snacks', is_tbwa: true },
  { id: 10, name: 'Oishi Martys', category: 'snacks', is_tbwa: true },
  { id: 11, name: 'Oishi Ridges', category: 'snacks', is_tbwa: true },
  { id: 12, name: 'Oishi Bread Pan', category: 'snacks', is_tbwa: true },
  { id: 13, name: 'Gourmet Picks', category: 'snacks', is_tbwa: true },
  { id: 14, name: 'Crispy Patata', category: 'snacks', is_tbwa: true },
  { id: 15, name: 'Oaties', category: 'snacks', is_tbwa: true },
  { id: 16, name: 'Hi-Ho Crackers', category: 'snacks', is_tbwa: true },
  { id: 17, name: 'Rinbee', category: 'snacks', is_tbwa: true },
  { id: 18, name: 'Deli Mex', category: 'snacks', is_tbwa: true },

  // TBWA CLIENT: Peerless (Household/Personal Care)
  { id: 19, name: 'Champion Detergent', category: 'household', is_tbwa: true },
  { id: 20, name: 'Champion Fabric Conditioner', category: 'household', is_tbwa: true },
  { id: 21, name: 'Calla Personal Care', category: 'personal_care', is_tbwa: true },
  { id: 22, name: 'Hana Shampoo', category: 'personal_care', is_tbwa: true },
  { id: 23, name: 'Hana Conditioner', category: 'personal_care', is_tbwa: true },
  { id: 24, name: 'Cyclone Bleach', category: 'household', is_tbwa: true },
  { id: 25, name: 'Pride Dishwashing Liquid', category: 'household', is_tbwa: true },
  { id: 26, name: 'Care Plus Alcohol', category: 'personal_care', is_tbwa: true },
  { id: 27, name: 'Care Plus Hand Sanitizer', category: 'personal_care', is_tbwa: true },

  // TBWA CLIENT: Del Monte Philippines (Food/Beverages)
  { id: 28, name: 'Del Monte Pineapple Juice', category: 'beverages', is_tbwa: true },
  { id: 29, name: 'Del Monte Pineapple Chunks', category: 'food', is_tbwa: true },
  { id: 30, name: 'Del Monte Tomato Sauce', category: 'food', is_tbwa: true },
  { id: 31, name: 'Del Monte Tomato Ketchup', category: 'food', is_tbwa: true },
  { id: 32, name: 'Del Monte Spaghetti Sauce', category: 'food', is_tbwa: true },
  { id: 33, name: 'Del Monte Fruit Cocktail', category: 'food', is_tbwa: true },
  { id: 34, name: 'Del Monte Pasta', category: 'food', is_tbwa: true },
  { id: 35, name: 'S&W Premium Fruits', category: 'food', is_tbwa: true },
  { id: 36, name: 'Todays Budget Line', category: 'food', is_tbwa: true },
  { id: 37, name: 'Fit n Right Juice', category: 'beverages', is_tbwa: true },

  // TBWA CLIENT: JTI (Tobacco)
  { id: 38, name: 'Winston Cigarettes', category: 'tobacco', is_tbwa: true },
  { id: 39, name: 'Camel Cigarettes', category: 'tobacco', is_tbwa: true },
  { id: 40, name: 'Mevius Cigarettes', category: 'tobacco', is_tbwa: true },
  { id: 41, name: 'LD Cigarettes', category: 'tobacco', is_tbwa: true },
  { id: 42, name: 'Mighty Cigarettes', category: 'tobacco', is_tbwa: true },
  { id: 43, name: 'Caster Cigarettes', category: 'tobacco', is_tbwa: true },
  { id: 44, name: 'Glamour Cigarettes', category: 'tobacco', is_tbwa: true },

  // TBWA CLIENT: Liwayway Beverages
  { id: 45, name: 'Smart C+ Vitamin Drinks', category: 'beverages', is_tbwa: true },

  // COMPETITORS: Dairy
  { id: 46, name: 'Bear Brand Milk', category: 'dairy', is_tbwa: false },
  { id: 47, name: 'Magnolia Fresh Milk', category: 'dairy', is_tbwa: false },
  { id: 48, name: 'Nestle Carnation', category: 'dairy', is_tbwa: false },
  { id: 49, name: 'Anchor Milk', category: 'dairy', is_tbwa: false },
  { id: 50, name: 'Everyday Milk', category: 'dairy', is_tbwa: false },

  // COMPETITORS: Snacks
  { id: 51, name: 'Jack n Jill Nova', category: 'snacks', is_tbwa: false },
  { id: 52, name: 'Jack n Jill Piattos', category: 'snacks', is_tbwa: false },
  { id: 53, name: 'Jack n Jill Chippy', category: 'snacks', is_tbwa: false },
  { id: 54, name: 'Rebisco Crackers', category: 'snacks', is_tbwa: false },
  { id: 55, name: 'Richeese Crackers', category: 'snacks', is_tbwa: false },
  { id: 56, name: 'Skyflakes Crackers', category: 'snacks', is_tbwa: false },
  { id: 57, name: 'Monde Crackers', category: 'snacks', is_tbwa: false },
  { id: 58, name: 'Hansel Crackers', category: 'snacks', is_tbwa: false },
  { id: 59, name: 'Lays Potato Chips', category: 'snacks', is_tbwa: false },
  { id: 60, name: 'Doritos', category: 'snacks', is_tbwa: false },

  // COMPETITORS: Household
  { id: 61, name: 'Tide Detergent', category: 'household', is_tbwa: false },
  { id: 62, name: 'Ariel Detergent', category: 'household', is_tbwa: false },
  { id: 63, name: 'Surf Detergent', category: 'household', is_tbwa: false },
  { id: 64, name: 'Downy Fabric Conditioner', category: 'household', is_tbwa: false },
  { id: 65, name: 'Joy Dishwashing Liquid', category: 'household', is_tbwa: false },
  { id: 66, name: 'Zonrox Bleach', category: 'household', is_tbwa: false },

  // COMPETITORS: Personal Care
  { id: 67, name: 'Head & Shoulders', category: 'personal_care', is_tbwa: false },
  { id: 68, name: 'Pantene Shampoo', category: 'personal_care', is_tbwa: false },
  { id: 69, name: 'Cream Silk', category: 'personal_care', is_tbwa: false },
  { id: 70, name: 'Sunsilk Shampoo', category: 'personal_care', is_tbwa: false },
  { id: 71, name: 'Clear Shampoo', category: 'personal_care', is_tbwa: false },
  { id: 72, name: 'Safeguard Soap', category: 'personal_care', is_tbwa: false },
  { id: 73, name: 'Dove Soap', category: 'personal_care', is_tbwa: false },
  { id: 74, name: 'Lux Soap', category: 'personal_care', is_tbwa: false },
  { id: 75, name: 'Palmolive Soap', category: 'personal_care', is_tbwa: false },

  // COMPETITORS: Food
  { id: 76, name: 'Hunts Tomato Sauce', category: 'food', is_tbwa: false },
  { id: 77, name: 'UFC Ketchup', category: 'food', is_tbwa: false },
  { id: 78, name: 'Clara Ole Pasta Sauce', category: 'food', is_tbwa: false },
  { id: 79, name: 'Lucky Me Instant Noodles', category: 'food', is_tbwa: false },
  { id: 80, name: 'Nissin Cup Noodles', category: 'food', is_tbwa: false },
  { id: 81, name: 'Maggi Noodles', category: 'food', is_tbwa: false },
  { id: 82, name: 'Century Tuna', category: 'food', is_tbwa: false },
  { id: 83, name: 'Argentina Corned Beef', category: 'food', is_tbwa: false },
  { id: 84, name: 'Spam', category: 'food', is_tbwa: false },
  { id: 85, name: 'Libbys Corned Beef', category: 'food', is_tbwa: false },

  // COMPETITORS: Beverages
  { id: 86, name: 'Coca-Cola', category: 'beverages', is_tbwa: false },
  { id: 87, name: 'Pepsi', category: 'beverages', is_tbwa: false },
  { id: 88, name: 'Sprite', category: 'beverages', is_tbwa: false },
  { id: 89, name: 'Royal Cola', category: 'beverages', is_tbwa: false },
  { id: 90, name: 'Tropicana Juice', category: 'beverages', is_tbwa: false },
  { id: 91, name: 'Minute Maid', category: 'beverages', is_tbwa: false },
  { id: 92, name: 'Zesto Juice', category: 'beverages', is_tbwa: false },
  { id: 93, name: 'Tang Powdered Juice', category: 'beverages', is_tbwa: false },
  { id: 94, name: 'Milo Chocolate Drink', category: 'beverages', is_tbwa: false },
  { id: 95, name: 'Nescafe Coffee', category: 'beverages', is_tbwa: false },
  { id: 96, name: 'Kopiko Coffee', category: 'beverages', is_tbwa: false },
  { id: 97, name: 'Great Taste Coffee', category: 'beverages', is_tbwa: false },
  { id: 98, name: 'Ovaltine', category: 'beverages', is_tbwa: false },
  { id: 99, name: 'Gatorade', category: 'beverages', is_tbwa: false },
  { id: 100, name: 'Powerade', category: 'beverages', is_tbwa: false },

  // COMPETITORS: Tobacco
  { id: 101, name: 'Marlboro', category: 'tobacco', is_tbwa: false },
  { id: 102, name: 'Philip Morris', category: 'tobacco', is_tbwa: false },
  { id: 103, name: 'Lucky Strike', category: 'tobacco', is_tbwa: false },
  { id: 104, name: 'Hope Cigarettes', category: 'tobacco', is_tbwa: false },
  { id: 105, name: 'Fortune Cigarettes', category: 'tobacco', is_tbwa: false }
];

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

async function loadComprehensiveDataset() {
  console.log('🚀 Loading comprehensive TBWA brands dataset...');
  
  try {
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await supabase.from('brands').delete().neq('id', 0);
    await supabase.from('stores').delete().neq('id', 0);
    
    // Insert brands in batches
    console.log('📋 Inserting 105 comprehensive brands...');
    const batchSize = 20;
    for (let i = 0; i < brands.length; i += batchSize) {
      const batch = brands.slice(i, i + batchSize);
      const { error } = await supabase.from('brands').insert(batch);
      if (error) {
        console.error(`Error inserting batch ${i/batchSize + 1}:`, error);
      } else {
        console.log(`✅ Inserted brands batch ${i/batchSize + 1}`);
      }
    }
    
    // Insert stores
    console.log('🏪 Inserting 8 stores...');
    const { error: storesError } = await supabase.from('stores').insert(stores);
    if (storesError) {
      console.error('Error inserting stores:', storesError);
    } else {
      console.log('✅ Stores inserted');
    }
    
    // Verify results
    const { data: finalBrands } = await supabase.from('brands').select('id, name, category, is_tbwa');
    const { data: finalStores } = await supabase.from('stores').select('id, name');
    
    console.log('\n🎉 COMPREHENSIVE DATASET LOADED:');
    console.log(`✅ Total brands: ${finalBrands?.length || 0}`);
    console.log(`✅ TBWA client brands: ${finalBrands?.filter(b => b.is_tbwa).length || 0}`);
    console.log(`✅ Competitor brands: ${finalBrands?.filter(b => !b.is_tbwa).length || 0}`);
    console.log(`✅ Total stores: ${finalStores?.length || 0}`);
    
    const categories = [...new Set(finalBrands?.map(b => b.category))];
    console.log(`✅ Categories: ${categories.join(', ')}`);
    
    if (finalBrands && finalBrands.length > 0) {
      console.log('\n🏷️ TBWA clients:', finalBrands.filter(b => b.is_tbwa).slice(0, 8).map(b => b.name));
      console.log('🏷️ Competitors:', finalBrands.filter(b => !b.is_tbwa).slice(0, 8).map(b => b.name));
    }
    
    console.log('\n📊 Your filter dropdown should now show all 105 brands!');
    
  } catch (error) {
    console.error('❌ Error loading dataset:', error);
  }
}

loadComprehensiveDataset();