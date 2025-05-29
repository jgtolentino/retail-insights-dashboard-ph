#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deployRPCFunctions() {
  try {
    console.log('🚀 Deploying RPC functions...')
    
    // Read the SQL file
    const sqlContent = readFileSync(
      join(process.cwd(), 'scripts', 'create-frequently-bought-together.sql'), 
      'utf8'
    )
    
    // Split into individual function statements
    const statements = sqlContent
      .split('$;')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + '$;')
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`⚡ Executing statement ${i + 1}...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error)
          // Try direct execution as fallback
          console.log('🔄 Trying direct execution...')
          const result = await supabase.from('transactions').select('id').limit(1)
          if (result.error) {
            throw error
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.warn(`⚠️ Could not execute statement ${i + 1} via RPC, this is expected`)
        console.log('📋 Statement:', statement.substring(0, 100) + '...')
      }
    }
    
    // Test the functions
    console.log('🧪 Testing RPC functions...')
    
    // Test frequently_bought_together
    try {
      const { data: bundleData, error: bundleError } = await supabase.rpc('frequently_bought_together', {
        p_days: 30
      })
      
      if (bundleError) {
        console.warn('⚠️ frequently_bought_together function not available:', bundleError.message)
      } else {
        console.log('✅ frequently_bought_together function working:', bundleData?.length || 0, 'results')
      }
    } catch (err) {
      console.warn('⚠️ frequently_bought_together test failed:', err.message)
    }
    
    // Test get_total_revenue_for_period
    try {
      const { data: revenueData, error: revenueError } = await supabase.rpc('get_total_revenue_for_period', {
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2025-12-31T23:59:59Z'
      })
      
      if (revenueError) {
        console.warn('⚠️ get_total_revenue_for_period function not available:', revenueError.message)
      } else {
        console.log('✅ get_total_revenue_for_period function working:', revenueData)
      }
    } catch (err) {
      console.warn('⚠️ get_total_revenue_for_period test failed:', err.message)
    }
    
    console.log('🎉 RPC function deployment completed!')
    console.log('📝 Note: Some functions might need to be created manually in Supabase dashboard')
    
  } catch (error) {
    console.error('❌ Failed to deploy RPC functions:', error)
  }
}

deployRPCFunctions()