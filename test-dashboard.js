import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lcoxtanyckjzyxxcsjzz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNDUzMjcsImV4cCI6MjA2MzkyMTMyN30.W2JgvZdXubvWpKCNZ7TfjLiKANZO1Hlb164fBEKH2dA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDashboardQueries() {
  console.log('Testing dashboard queries with fixed date range...')
  
  // Use fixed end date that matches your data
  const endDate = new Date('2025-05-30T23:59:59Z')
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 30)
  
  console.log('Date range:', {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  })
  
  // Test transactions query
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('total_amount, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
  
  if (txError) {
    console.error('Transaction error:', txError)
  } else {
    const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.total_amount || 0), 0) || 0
    console.log('Results:')
    console.log('- Total transactions:', transactions?.length || 0)
    console.log('- Total revenue:', totalRevenue.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }))
  }
  
  // Test brand performance
  const { data: brands, error: brandError } = await supabase
    .from('brands')
    .select('*')
    .limit(5)
  
  if (brandError) {
    console.error('Brand error:', brandError)
  } else {
    console.log('- Sample brands:', brands?.map(b => b.name).join(', '))
  }
}

testDashboardQueries().catch(console.error)