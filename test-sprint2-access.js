import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Function to load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.error('❌ Could not read .env file:', error.message)
    return {}
  }
}

// Load environment variables
const envVars = loadEnvFile()

// Use environment variables for credentials
const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file')
  console.error('Expected format in .env file:')
  console.error('VITE_SUPABASE_URL=https://your-project.supabase.co')
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key-here')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSprint2Access() {
  console.log('Testing Sprint 2 table access...\n')
  
  // Test 1: Products table
  console.log('1. Testing products table:')
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(5)
  
  if (productsError) {
    console.error('❌ Products error:', productsError.message)
  } else {
    console.log('✅ Products accessible. Count:', products?.length || 0)
    if (products?.[0]) {
      console.log('   Sample product:', products[0].name)
    }
  }
  
  // Test 2: Brands table
  console.log('\n2. Testing brands table:')
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('*')
    .limit(5)
  
  if (brandsError) {
    console.error('❌ Brands error:', brandsError.message)
  } else {
    console.log('✅ Brands accessible. Count:', brands?.length || 0)
    if (brands?.[0]) {
      console.log('   Sample brand:', brands[0].name)
    }
  }
  
  // Test 3: Categories from products
  console.log('\n3. Testing product categories:')
  const { data: categories, error: categoriesError } = await supabase
    .from('products')
    .select('category')
    .not('category', 'is', null)
    .limit(10)
  
  if (categoriesError) {
    console.error('❌ Categories error:', categoriesError.message)
  } else {
    const uniqueCategories = [...new Set(categories?.map(p => p.category) || [])]
    console.log('✅ Categories found:', uniqueCategories.length)
    console.log('   Sample categories:', uniqueCategories.slice(0, 3).join(', '))
  }
  
  // Test 4: Transaction items with joins
  console.log('\n4. Testing transaction_items with joins:')
  const { data: items, error: itemsError } = await supabase
    .from('transaction_items')
    .select(`
      quantity,
      price,
      products!inner(
        name,
        category,
        brands!inner(
          name
        )
      ),
      transactions!inner(
        created_at
      )
    `)
    .limit(5)
  
  if (itemsError) {
    console.error('❌ Transaction items error:', itemsError.message)
  } else {
    console.log('✅ Transaction items accessible with joins. Count:', items?.length || 0)
    if (items?.[0]) {
      console.log('   Sample item:', {
        product: items[0].products?.name,
        brand: items[0].products?.brands?.name,
        quantity: items[0].quantity
      })
    }
  }
  
  // Test 5: Date range query
  console.log('\n5. Testing date range query:')
  const startDate = new Date('2025-04-30')
  const endDate = new Date('2025-05-30')
  
  const { data: rangeData, error: rangeError } = await supabase
    .from('transactions')
    .select('id, created_at, total_amount')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .limit(10)
  
  if (rangeError) {
    console.error('❌ Date range error:', rangeError.message)
  } else {
    console.log('✅ Date range query successful. Count:', rangeData?.length || 0)
    if (rangeData?.length > 0) {
      console.log('   Date range:', {
        first: rangeData[0].created_at,
        last: rangeData[rangeData.length - 1].created_at
      })
    }
  }
  
  console.log('\n📊 Summary:')
  console.log('If all tests show ✅, Sprint 2 validation should pass!')
  console.log('If any show ❌, run the fix_sprint2_rls.sql in Supabase SQL editor.')
}

testSprint2Access().catch(console.error)
