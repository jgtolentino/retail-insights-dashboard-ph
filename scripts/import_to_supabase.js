const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDA0NzUsImV4cCI6MjA2Mzg3NjQ3NX0.O6beSaKNUanbvASudEeOVCo-i6BVNcX5X-qtb7zANpM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearExistingData() {
  console.log('Clearing existing data...');
  
  // Clear in correct order due to foreign keys
  const tables = ['transaction_items', 'transactions', 'products', 'brands'];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', 0); // Delete all records
      
    if (error) {
      console.error(`Error clearing ${table}:`, error);
    } else {
      console.log(`Cleared ${table}`);
    }
  }
}

async function insertFromCSV(tableName, csvFile) {
  const filePath = path.join(__dirname, csvFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  return new Promise((resolve, reject) => {
    csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }, async (err, records) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log(`Inserting ${records.length} records into ${tableName}...`);
      
      // Convert data types
      records = records.map(record => {
        // Convert numeric fields
        if (record.id) record.id = parseInt(record.id);
        if (record.brand_id) record.brand_id = parseInt(record.brand_id);
        if (record.product_id) record.product_id = parseInt(record.product_id);
        if (record.transaction_id) record.transaction_id = parseInt(record.transaction_id);
        if (record.quantity) record.quantity = parseInt(record.quantity);
        if (record.customer_age) record.customer_age = parseInt(record.customer_age);
        if (record.price) record.price = parseFloat(record.price);
        if (record.total_amount) record.total_amount = parseFloat(record.total_amount);
        
        // Convert boolean fields
        if (record.is_tbwa !== undefined) {
          record.is_tbwa = record.is_tbwa === 'true' || record.is_tbwa === 'True';
        }
        
        return record;
      });
      
      // Insert in batches of 500
      const batchSize = 500;
      let totalInserted = 0;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from(tableName)
          .insert(batch)
          .select();
          
        if (error) {
          console.error(`Error inserting into ${tableName}:`, error);
          console.error('Failed batch sample:', batch[0]);
        } else {
          totalInserted += batch.length;
          console.log(`Progress: ${totalInserted}/${records.length} records`);
        }
      }
      
      console.log(`✓ Completed ${tableName}: ${totalInserted} records inserted\n`);
      resolve();
    });
  });
}

async function verifyImport() {
  console.log('\n=== Verifying Import ===');
  
  // Check record counts
  const tables = ['brands', 'products', 'transactions', 'transaction_items'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error(`Error counting ${table}:`, error);
    } else {
      console.log(`${table}: ${count} records`);
    }
  }
  
  // Check date range
  const { data: dateRange } = await supabase
    .from('transactions')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1);
    
  const { data: dateRangeEnd } = await supabase
    .from('transactions')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (dateRange && dateRangeEnd) {
    console.log(`\nDate range: ${dateRange[0].created_at} to ${dateRangeEnd[0].created_at}`);
  }
  
  // Check brand sales
  console.log('\n=== Brand Sales Summary ===');
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('name');
    
  for (const brand of brands || []) {
    // Get sales for this brand
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('brand_id', brand.id);
      
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      
      const { data: sales } = await supabase
        .from('transaction_items')
        .select('quantity, price')
        .in('product_id', productIds);
        
      if (sales) {
        const totalSales = sales.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        console.log(`${brand.name}: ₱${totalSales.toLocaleString()}`);
      }
    }
  }
}

// Main import function
async function importAll() {
  try {
    console.log('Starting data import to Supabase...\n');
    
    // First, clear existing data
    await clearExistingData();
    
    // Import in order (respecting foreign keys)
    await insertFromCSV('brands', 'brands.csv');
    await insertFromCSV('products', 'products.csv');
    await insertFromCSV('transactions', 'transactions_complete.csv');
    await insertFromCSV('transaction_items', 'transaction_items_complete.csv');
    
    // Verify the import
    await verifyImport();
    
    console.log('\n✅ Import complete! Your dashboard should now show the updated data.');
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Check if CSV files exist
const requiredFiles = ['brands.csv', 'products.csv', 'transactions_complete.csv', 'transaction_items_complete.csv'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));

if (missingFiles.length > 0) {
  console.error('Missing required CSV files:', missingFiles);
  console.log('\nPlease run generate_complete_data.py first to create the CSV files.');
  process.exit(1);
}

// Run the import
importAll();