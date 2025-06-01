#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 GENERATING 843 STRATEGIC TOP-UP TRANSACTIONS TO REACH 15,000 TOTAL');
console.log('📊 Current: 14,157 → Target: 15,000 transactions\n');

// Enhanced brand portfolio with TBWA clients and competitors
const tbwaClientBrands = [
  // Alaska Milk Corporation
  { id: 101, name: 'Alaska Evaporated Milk', category: 'dairy', brand_id: 101, is_tbwa: true, price_range: [45, 65] },
  { id: 102, name: 'Alaska Condensed Milk', category: 'dairy', brand_id: 101, is_tbwa: true, price_range: [50, 75] },
  { id: 103, name: 'Alaska Powdered Milk', category: 'dairy', brand_id: 101, is_tbwa: true, price_range: [180, 250] },
  { id: 104, name: 'Krem-Top Coffee Creamer', category: 'dairy', brand_id: 101, is_tbwa: true, price_range: [25, 40] },
  { id: 105, name: 'Alpine Milk', category: 'dairy', brand_id: 101, is_tbwa: true, price_range: [45, 70] },
  
  // Oishi (Liwayway Marketing)
  { id: 201, name: 'Oishi Prawn Crackers', category: 'snacks', brand_id: 102, is_tbwa: true, price_range: [15, 25] },
  { id: 202, name: 'Oishi Pillows', category: 'snacks', brand_id: 102, is_tbwa: true, price_range: [18, 30] },
  { id: 203, name: 'Oishi Ridges', category: 'snacks', brand_id: 102, is_tbwa: true, price_range: [20, 35] },
  { id: 204, name: 'Smart C+ Vitamin Drinks', category: 'beverages', brand_id: 102, is_tbwa: true, price_range: [12, 20] },
  { id: 205, name: 'Hi-Ho Crackers', category: 'snacks', brand_id: 102, is_tbwa: true, price_range: [25, 40] },
  
  // Champion (Peerless Products)
  { id: 301, name: 'Champion Detergent', category: 'household', brand_id: 103, is_tbwa: true, price_range: [35, 85] },
  { id: 302, name: 'Champion Fabric Conditioner', category: 'household', brand_id: 103, is_tbwa: true, price_range: [45, 75] },
  { id: 303, name: 'Pride Dishwashing Liquid', category: 'household', brand_id: 103, is_tbwa: true, price_range: [25, 45] },
  { id: 304, name: 'Hana Shampoo', category: 'personal_care', brand_id: 103, is_tbwa: true, price_range: [8, 15] },
  
  // Del Monte Philippines
  { id: 401, name: 'Del Monte Pineapple Juice', category: 'beverages', brand_id: 104, is_tbwa: true, price_range: [35, 55] },
  { id: 402, name: 'Del Monte Tomato Sauce', category: 'condiments', brand_id: 104, is_tbwa: true, price_range: [18, 30] },
  { id: 403, name: 'Del Monte Spaghetti Sauce', category: 'condiments', brand_id: 104, is_tbwa: true, price_range: [28, 45] },
  { id: 404, name: 'Fit n Right Juice', category: 'beverages', brand_id: 104, is_tbwa: true, price_range: [15, 25] },
  
  // JTI Tobacco
  { id: 501, name: 'Winston Cigarettes', category: 'tobacco', brand_id: 105, is_tbwa: true, price_range: [140, 160] },
  { id: 502, name: 'Camel Cigarettes', category: 'tobacco', brand_id: 105, is_tbwa: true, price_range: [150, 170] },
  { id: 503, name: 'Mevius Cigarettes', category: 'tobacco', brand_id: 105, is_tbwa: true, price_range: [160, 180] },
  
  // San Miguel Brewery
  { id: 601, name: 'San Miguel Beer', category: 'alcoholic_beverages', brand_id: 106, is_tbwa: true, price_range: [45, 65] },
  { id: 602, name: 'Red Horse Beer', category: 'alcoholic_beverages', brand_id: 106, is_tbwa: true, price_range: [50, 70] },
  { id: 603, name: 'San Mig Light', category: 'alcoholic_beverages', brand_id: 106, is_tbwa: true, price_range: [45, 65] },
  
  // Coca-Cola Philippines
  { id: 701, name: 'Coca-Cola', category: 'beverages', brand_id: 107, is_tbwa: true, price_range: [15, 35] },
  { id: 702, name: 'Sprite', category: 'beverages', brand_id: 107, is_tbwa: true, price_range: [15, 35] },
  { id: 703, name: 'Royal Tru-Orange', category: 'beverages', brand_id: 107, is_tbwa: true, price_range: [15, 35] },
  { id: 704, name: 'Wilkins Water', category: 'beverages', brand_id: 107, is_tbwa: true, price_range: [20, 40] },
  
  // Monde Nissin
  { id: 801, name: 'Lucky Me Instant Noodles', category: 'instant_food', brand_id: 108, is_tbwa: true, price_range: [12, 18] },
  { id: 802, name: 'SkyFlakes Crackers', category: 'snacks', brand_id: 108, is_tbwa: true, price_range: [25, 40] },
  { id: 803, name: 'Nissin Cup Noodles', category: 'instant_food', brand_id: 108, is_tbwa: true, price_range: [20, 35] }
];

const competitorBrands = [
  // Nestle competitors
  { id: 901, name: 'Bear Brand Milk', category: 'dairy', brand_id: 201, is_tbwa: false, price_range: [20, 35] },
  { id: 902, name: 'Nido Powdered Milk', category: 'dairy', brand_id: 201, is_tbwa: false, price_range: [200, 300] },
  { id: 903, name: 'Milo Chocolate Drink', category: 'beverages', brand_id: 201, is_tbwa: false, price_range: [180, 250] },
  
  // URC competitors
  { id: 904, name: 'Jack n Jill Potato Chips', category: 'snacks', brand_id: 202, is_tbwa: false, price_range: [18, 30] },
  { id: 905, name: 'Piattos', category: 'snacks', brand_id: 202, is_tbwa: false, price_range: [20, 35] },
  { id: 906, name: 'C2 Green Tea', category: 'beverages', brand_id: 202, is_tbwa: false, price_range: [18, 28] },
  
  // Unilever competitors
  { id: 907, name: 'Surf Detergent', category: 'household', brand_id: 203, is_tbwa: false, price_range: [40, 90] },
  { id: 908, name: 'Cream Silk Shampoo', category: 'personal_care', brand_id: 203, is_tbwa: false, price_range: [8, 15] },
  
  // Philip Morris competitors
  { id: 909, name: 'Marlboro Cigarettes', category: 'tobacco', brand_id: 204, is_tbwa: false, price_range: [155, 175] },
  { id: 910, name: 'Philip Morris Cigarettes', category: 'tobacco', brand_id: 204, is_tbwa: false, price_range: [145, 165] },
  
  // Pepsi competitors
  { id: 911, name: 'Pepsi Cola', category: 'beverages', brand_id: 205, is_tbwa: false, price_range: [15, 35] },
  { id: 912, name: '7UP', category: 'beverages', brand_id: 205, is_tbwa: false, price_range: [15, 35] }
];

// Comprehensive 18 Philippine regions with realistic locations
const regions = [
  {
    name: 'NCR',
    cities: ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong'],
    barangays: ['Ermita', 'Malate', 'Cubao', 'Diliman', 'Poblacion', 'Kapitolyo', 'BGC', 'Ortigas']
  },
  {
    name: 'Region I - Ilocos',
    cities: ['Laoag', 'Vigan', 'San Fernando', 'Dagupan'],
    barangays: ['Poblacion Norte', 'Poblacion Sur', 'Barangay 1', 'Centro']
  },
  {
    name: 'Region II - Cagayan Valley',
    cities: ['Tuguegarao', 'Ilagan', 'Cauayan', 'Santiago'],
    barangays: ['Centro', 'Poblacion', 'Barangay Uno', 'Villa']
  },
  {
    name: 'Region III - Central Luzon',
    cities: ['Angeles', 'San Fernando', 'Olongapo', 'Malolos', 'Cabanatuan'],
    barangays: ['Poblacion', 'Centro', 'Barangay 1', 'Villa Aurora']
  },
  {
    name: 'Region IV-A - CALABARZON',
    cities: ['Antipolo', 'Lipa', 'Lucena', 'Calamba', 'Santa Rosa'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay Uno']
  },
  {
    name: 'Region IV-B - MIMAROPA',
    cities: ['Calapan', 'Puerto Princesa', 'Roxas', 'Boac'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay 1']
  },
  {
    name: 'Region V - Bicol',
    cities: ['Legazpi', 'Naga', 'Iriga', 'Sorsogon'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay Uno']
  },
  {
    name: 'Region VI - Western Visayas',
    cities: ['Iloilo City', 'Bacolod', 'Kalibo', 'Roxas'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Jaro']
  },
  {
    name: 'Region VII - Central Visayas',
    cities: ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Tagbilaran'],
    barangays: ['Lahug', 'Poblacion', 'Centro', 'Capitol Site']
  },
  {
    name: 'Region VIII - Eastern Visayas',
    cities: ['Tacloban', 'Ormoc', 'Catbalogan', 'Borongan'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay 1']
  },
  {
    name: 'Region IX - Zamboanga Peninsula',
    cities: ['Zamboanga City', 'Pagadian', 'Dipolog', 'Dapitan'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Zone I']
  },
  {
    name: 'Region X - Northern Mindanao',
    cities: ['Cagayan de Oro', 'Iligan', 'Butuan', 'Malaybalay'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Carmen']
  },
  {
    name: 'Region XI - Davao',
    cities: ['Davao City', 'Tagum', 'Panabo', 'Samal'],
    barangays: ['Poblacion', 'Centro', 'Buhangin', 'Panacan']
  },
  {
    name: 'Region XII - SOCCSKSARGEN',
    cities: ['General Santos', 'Koronadal', 'Tacurong', 'Kidapawan'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay 1']
  },
  {
    name: 'Region XIII - Caraga',
    cities: ['Butuan', 'Surigao', 'Bayugan', 'Cabadbaran'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay Uno']
  },
  {
    name: 'CAR - Cordillera',
    cities: ['Baguio', 'Tabuk', 'Bangued', 'La Trinidad'],
    barangays: ['Poblacion', 'Centro', 'Session Road', 'Burnham']
  },
  {
    name: 'BARMM - Bangsamoro',
    cities: ['Cotabato City', 'Marawi', 'Jolo', 'Bongao'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay 1']
  },
  {
    name: 'Region XIV - Negros Island',
    cities: ['Bacolod', 'Dumaguete', 'Talisay', 'Silay'],
    barangays: ['Poblacion', 'Centro', 'Villa', 'Barangay Uno']
  }
];

// Realistic sari-sari store names by tier
const storeNames = {
  tier1: [
    "Ate Susan's Premium Store", "Kuya Ben's Superette", "Nanay Mercy's Mart", 
    "Tita's Choice Store", "Mang Tony's Mini Mart", "Aling Rosa's Deluxe Store",
    "Kuya Jun's Premium Shop", "Ate Grace's Complete Store", "Tito's Family Mart"
  ],
  tier2: [
    "Nanay Luz Store", "Tindahan ni Mang Tony", "Ate Baby's Store", 
    "Kuya Boy's Shop", "Aling Carmen's Tindahan", "Manong's Store",
    "Tita Nena's Store", "Kuya Rod's Shop", "Ate Linda's Tindahan"
  ],
  tier3: [
    "Mini Store ni Aling Rosa", "Tita's Corner Store", "Sari-sari ni Ate", 
    "Kuya's Small Store", "Nanay's Mini Shop", "Kapitbahay Store",
    "Tindahan sa Kanto", "Mini Mart ni Kuya", "Aling's Corner Shop"
  ]
};

// Generate random values
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate() {
  const start = new Date('2025-03-08');
  const end = new Date('2025-05-31');
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate store distribution
function generateStores() {
  const stores = [];
  let storeId = 1001; // Start after existing stores
  
  regions.forEach(region => {
    // Distribute stores per region based on economic importance
    let storesPerRegion;
    if (['NCR', 'Region III - Central Luzon', 'Region IV-A - CALABARZON'].includes(region.name)) {
      storesPerRegion = 60; // High-impact regions
    } else if (region.name.includes('Visayas') || region.name.includes('Davao')) {
      storesPerRegion = 35; // Medium-impact regions
    } else {
      storesPerRegion = 20; // Other regions
    }
    
    for (let i = 0; i < storesPerRegion; i++) {
      const city = randomChoice(region.cities);
      const barangay = randomChoice(region.barangays);
      
      // Determine store tier (10% tier1, 30% tier2, 60% tier3)
      let tier, storeName;
      const rand = Math.random();
      if (rand < 0.1) {
        tier = 1;
        storeName = randomChoice(storeNames.tier1);
      } else if (rand < 0.4) {
        tier = 2;
        storeName = randomChoice(storeNames.tier2);
      } else {
        tier = 3;
        storeName = randomChoice(storeNames.tier3);
      }
      
      stores.push({
        id: storeId++,
        name: storeName,
        location: `${barangay}, ${city}, ${region.name}`,
        region: region.name,
        city: city,
        barangay: barangay,
        tier: tier
      });
    }
  });
  
  return stores;
}

// Generate strategic transactions
function generateStrategicTransactions() {
  console.log('📋 Generating stores...');
  const stores = generateStores();
  
  console.log('📦 Generating strategic transactions...');
  const transactions = [];
  const transactionItems = [];
  let transactionId = 14158; // Start after existing 14,157
  let itemId = 20000; // Start after existing items
  
  // Strategic distribution of 843 transactions
  const distribution = [
    { focus: 'TBWA_brands', count: 300, description: 'TBWA brand enhancement' },
    { focus: 'premium_stores', count: 200, description: 'Premium store tier boost' },
    { focus: 'regional_balance', count: 243, description: 'Regional balance' },
    { focus: 'competitors', count: 100, description: 'Competitive landscape' }
  ];
  
  distribution.forEach(segment => {
    console.log(`🎯 Generating ${segment.count} transactions for ${segment.description}...`);
    
    for (let i = 0; i < segment.count; i++) {
      // Select appropriate store based on segment focus
      let selectedStore;
      if (segment.focus === 'premium_stores') {
        selectedStore = randomChoice(stores.filter(s => s.tier === 1));
      } else if (segment.focus === 'regional_balance') {
        // Focus on underrepresented regions
        const ruralRegions = stores.filter(s => 
          s.region.includes('BARMM') || s.region.includes('CAR') || 
          s.region.includes('Eastern Visayas') || s.region.includes('Caraga')
        );
        selectedStore = randomChoice(ruralRegions.length > 0 ? ruralRegions : stores);
      } else {
        selectedStore = randomChoice(stores);
      }
      
      // Customer demographics
      const age = randomInt(18, 65);
      const gender = randomChoice(['Male', 'Female']);
      const date = randomDate();
      
      // Select products based on segment focus
      let availableProducts;
      if (segment.focus === 'TBWA_brands') {
        availableProducts = tbwaClientBrands;
      } else if (segment.focus === 'competitors') {
        availableProducts = competitorBrands;
      } else {
        availableProducts = [...tbwaClientBrands, ...competitorBrands];
      }
      
      // Generate transaction items (1-4 items per transaction)
      const itemCount = selectedStore.tier === 1 ? randomInt(2, 4) : 
                       selectedStore.tier === 2 ? randomInt(1, 3) : randomInt(1, 2);
      
      let totalAmount = 0;
      const transactionProducts = [];
      
      for (let j = 0; j < itemCount; j++) {
        const product = randomChoice(availableProducts);
        const quantity = randomInt(1, 3);
        const price = randomFloat(product.price_range[0], product.price_range[1]);
        const itemTotal = price * quantity;
        
        transactionItems.push({
          id: itemId++,
          transaction_id: transactionId,
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          price: price,
          category: product.category,
          is_tbwa: product.is_tbwa
        });
        
        totalAmount += itemTotal;
        transactionProducts.push(product.name);
      }
      
      transactions.push({
        id: transactionId,
        created_at: date.toISOString(),
        total_amount: parseFloat(totalAmount.toFixed(2)),
        customer_age: age,
        customer_gender: gender,
        store_id: selectedStore.id,
        store_name: selectedStore.name,
        store_location: selectedStore.location,
        store_tier: selectedStore.tier,
        region: selectedStore.region,
        city: selectedStore.city,
        barangay: selectedStore.barangay,
        item_count: itemCount,
        products: transactionProducts.join(', ')
      });
      
      transactionId++;
    }
  });
  
  return { transactions, transactionItems, stores };
}

// Main execution
try {
  console.log('🚀 Starting 15K dataset completion...\n');
  
  const { transactions, transactionItems, stores } = generateStrategicTransactions();
  
  console.log('\n📊 GENERATION COMPLETE!');
  console.log(`✅ Generated ${transactions.length} strategic transactions`);
  console.log(`✅ Generated ${transactionItems.length} transaction items`);
  console.log(`✅ Created ${stores.length} stores across 18 regions`);
  
  // Create CSV content for transactions
  const transactionsCsv = [
    'id,created_at,total_amount,customer_age,customer_gender,store_location,store_tier,region',
    ...transactions.map(t => 
      `${t.id},${t.created_at},${t.total_amount},${t.customer_age},${t.customer_gender},"${t.store_location}",${t.store_tier},"${t.region}"`
    )
  ].join('\n');
  
  // Create CSV content for transaction items
  const itemsCsv = [
    'id,transaction_id,product_id,product_name,quantity,price,category,is_tbwa',
    ...transactionItems.map(i => 
      `${i.id},${i.transaction_id},${i.product_id},"${i.product_name}",${i.quantity},${i.price},"${i.category}",${i.is_tbwa}`
    )
  ].join('\n');
  
  // Create stores CSV
  const storesCsv = [
    'id,name,location,region,city,barangay,tier',
    ...stores.map(s => 
      `${s.id},"${s.name}","${s.location}","${s.region}","${s.city}","${s.barangay}",${s.tier}`
    )
  ].join('\n');
  
  // Write files
  fs.writeFileSync('transactions_topup_843.csv', transactionsCsv);
  fs.writeFileSync('transaction_items_topup_843.csv', itemsCsv);
  fs.writeFileSync('stores_comprehensive.csv', storesCsv);
  
  console.log('\n📁 FILES CREATED:');
  console.log('✅ transactions_topup_843.csv');
  console.log('✅ transaction_items_topup_843.csv');
  console.log('✅ stores_comprehensive.csv');
  
  // Analytics summary
  const tbwaTransactions = transactionItems.filter(i => i.is_tbwa).length;
  const competitorTransactions = transactionItems.filter(i => !i.is_tbwa).length;
  const regionCount = [...new Set(transactions.map(t => t.region))].length;
  
  console.log('\n📈 STRATEGIC COVERAGE ACHIEVED:');
  console.log(`🎯 TBWA brand items: ${tbwaTransactions}`);
  console.log(`🏢 Competitor brand items: ${competitorTransactions}`);
  console.log(`🗺️ Regions covered: ${regionCount}/18`);
  console.log(`🏪 Store tiers: Tier 1, 2, 3 all represented`);
  
  console.log('\n🎊 READY TO MERGE WITH EXISTING 14,157 TRANSACTIONS!');
  console.log('📊 Final dataset will have exactly 15,000 transactions');
  
} catch (error) {
  console.error('❌ Error generating dataset:', error);
  process.exit(1);
}