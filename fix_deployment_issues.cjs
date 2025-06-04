console.log('🔧 FIXING DEPLOYMENT ISSUES');
console.log('============================');

const SUPABASE_URL = 'https://lcoxtanyckjzyxxcsjzz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjb3h0YW55Y2tqenl4eGNzanp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM0NTMyNywiZXhwIjoyMDYzOTIxMzI3fQ.42ByHcIAi1jrcpzdvfcMJyE6ibqr81d-rIjsqxL_Bbk';

async function createCustomersTable() {
  try {
    console.log('📊 Creating customers table...');
    
    // Check if customers table exists
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    
    if (checkResponse.status === 404) {
      console.log('❌ Customers table missing - needs manual creation');
      console.log('');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/sql');
      console.log('');
      console.log('📝 Execute this SQL to create customers table:');
      console.log('');
      console.log(`-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  region TEXT NOT NULL,
  city TEXT,
  barangay TEXT,
  loyalty_tier TEXT DEFAULT 'regular',
  total_spent DECIMAL(10,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data
INSERT INTO customers (customer_id, name, age, gender, region, city, loyalty_tier, total_spent, visit_count) VALUES
('CUST001', 'Maria Santos', 28, 'Female', 'NCR', 'Manila', 'gold', 15000.00, 45),
('CUST002', 'Juan dela Cruz', 35, 'Male', 'Region IV-A', 'Cavite', 'silver', 8500.00, 23),
('CUST003', 'Ana Garcia', 24, 'Female', 'Region VII', 'Cebu', 'regular', 3200.00, 12),
('CUST004', 'Carlos Rodriguez', 42, 'Male', 'NCR', 'Quezon City', 'platinum', 25000.00, 78),
('CUST005', 'Lisa Fernandez', 31, 'Female', 'Region IV-A', 'Laguna', 'gold', 12000.00, 34);

-- Enable RLS and permissions
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read customers" ON customers FOR SELECT TO authenticated USING (true);
GRANT SELECT ON customers TO authenticated;`);
      
      console.log('');
      console.log('✅ After creating customers table, redeploy the frontend');
      
    } else if (checkResponse.ok) {
      console.log('✅ Customers table exists');
      const data = await checkResponse.json();
      console.log(`📊 Has ${data.length > 0 ? 'data' : 'no data'}`);
    } else {
      console.log('⚠️  Customers table check failed:', checkResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createCustomersTable();