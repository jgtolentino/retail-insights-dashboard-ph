const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDA0NzUsImV4cCI6MjA2Mzg3NjQ3NX0.O6beSaKNUanbvASudEeOVCo-i6BVNcX5X-qtb7zANpM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTables() {
  console.log('Clearing existing data...');
  
  // Clear transaction_items first (foreign key constraint)
  const { error: itemsError } = await supabase
    .from('transaction_items')
    .delete()
    .gte('id', 0);
    
  if (itemsError) {
    console.error('Error clearing transaction_items:', itemsError);
  }
  
  // Clear transactions
  const { error: transError } = await supabase
    .from('transactions')
    .delete()
    .gte('id', 0);
    
  if (transError) {
    console.error('Error clearing transactions:', transError);
  }
  
  // Clear products
  const { error: prodError } = await supabase
    .from('products')
    .delete()
    .gte('id', 0);
    
  if (prodError) {
    console.error('Error clearing products:', prodError);
  }
  
  // Clear brands
  const { error: brandError } = await supabase
    .from('brands')
    .delete()
    .gte('id', 0);
    
  if (brandError) {
    console.error('Error clearing brands:', brandError);
  }
  
  console.log('Tables cleared');
}

async function importCSV(filename, tableName) {
  const filepath = path.join(__dirname, filename);
  const fileContent = fs.readFileSync(filepath, 'utf-8');
  
  return new Promise((resolve, reject) => {
    csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }, async (err, records) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Convert data types
      records = records.map(record => {
        // Convert numeric fields
        if (record.id) record.id = parseInt(record.id);
        if (record.brand_id) record.brand_id = parseInt(record.brand_id);
        if (record.product_id) record.product_id = parseInt(record.product_id);
        if (record.quantity) record.quantity = parseInt(record.quantity);
        if (record.items_count) record.items_count = parseInt(record.items_count);
        if (record.price) record.price = parseFloat(record.price);
        if (record.total_amount) record.total_amount = parseFloat(record.total_amount);
        if (record.subtotal) record.subtotal = parseFloat(record.subtotal);
        
        // Convert boolean fields
        if (record.is_tbwa !== undefined) {
          record.is_tbwa = record.is_tbwa === 'True' || record.is_tbwa === 'true';
        }
        
        return record;
      });
      
      console.log(`Importing ${records.length} records into ${tableName}...`);
      
      // Insert in batches
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from(tableName)
          .insert(batch)
          .select();
          
        if (error) {
          console.error(`Error inserting batch ${i/batchSize + 1}:`, error);
          console.error('Sample record:', batch[0]);
        } else {
          inserted += batch.length;
          if (i % 1000 === 0) {
            console.log(`Progress: ${inserted}/${records.length}`);
          }
        }
      }
      
      console.log(`✓ Imported ${inserted} records into ${tableName}\n`);
      resolve();
    });
  });
}

async function main() {
  try {
    // Clear existing data
    await clearTables();
    
    // Import in order
    await importCSV('brands_simple.csv', 'brands');
    await importCSV('products_simple.csv', 'products');
    await importCSV('transactions_simple.csv', 'transactions');
    await importCSV('transaction_items_simple.csv', 'transaction_items');
    
    // Verify
    console.log('\n=== Verification ===');
    
    const { count: brandCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    console.log(`Brands: ${brandCount}`);
    
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    console.log(`Products: ${productCount}`);
    
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    console.log(`Transactions: ${transactionCount}`);
    
    const { count: itemCount } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true });
    console.log(`Transaction Items: ${itemCount}`);
    
    console.log('\n✅ Import complete!');
    console.log('Your dashboard should now show the updated data.');
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

main();