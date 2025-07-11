import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSnapshotQA() {
  try {
    console.log('📊 Running Snapshot QA Queries...\n');

    // 1. Transaction Analytics Snapshot
    console.log('1️⃣ Transaction Analytics Snapshot:');
    const { data: transactionData, error: transactionError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            DATE(t.transaction_date) as transaction_day,
            t.request_type,
            t.payment_method,
            COUNT(*) as transaction_count,
            AVG(t.checkout_seconds) as avg_checkout_time,
            AVG(CASE WHEN t.suggestion_accepted THEN 1 ELSE 0 END) as acceptance_rate,
            SUM(t.total_amount) as total_revenue,
            COUNT(DISTINCT t.customer_id) as unique_customers
          FROM transactions t
          GROUP BY transaction_day, t.request_type, t.payment_method
          ORDER BY transaction_day DESC
          LIMIT 10;
        `
      });

    if (transactionError) throw transactionError;
    console.log(JSON.stringify(transactionData, null, 2));

    // 2. Substitution Patterns Analysis
    console.log('\n2️⃣ Substitution Patterns Analysis:');
    const { data: substitutionData, error: substitutionError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            op.brand as original_brand,
            sp.brand as substitute_brand,
            op.name as original_product,
            sp.name as substitute_product,
            COUNT(*) as substitution_count,
            AVG(s.acceptance_rate)::NUMERIC(4,2) as acceptance_rate,
            AVG(sp.price - op.price)::NUMERIC(10,2) as avg_price_diff
          FROM substitutions s
          JOIN products op ON s.original_product_id = op.id
          JOIN products sp ON s.substituted_product_id = sp.id
          JOIN transactions t ON s.transaction_id = t.id
          WHERE t.checkout_time BETWEEN NOW() - INTERVAL '30 days' AND NOW()
          GROUP BY op.brand, sp.brand, op.name, sp.name
          HAVING COUNT(*) >= 3
          ORDER BY substitution_count DESC, acceptance_rate DESC
          LIMIT 10;
        `
      });

    if (substitutionError) throw substitutionError;
    console.log(JSON.stringify(substitutionData, null, 2));

    // 3. Request Behavior Analysis
    console.log('\n3️⃣ Request Behavior Analysis:');
    const { data: behaviorData, error: behaviorError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            t.request_type,
            COUNT(*) as total_count,
            AVG(t.checkout_seconds)::NUMERIC(6,2) as avg_checkout_seconds,
            AVG(CASE WHEN t.suggestion_accepted THEN 1 ELSE 0 END)::NUMERIC(4,2) as suggestion_acceptance_rate,
            AVG(COALESCE(rb.clarification_count, 0))::NUMERIC(4,2) as avg_clarifications,
            AVG(CASE WHEN rb.gesture_used THEN 1 ELSE 0 END)::NUMERIC(4,2) as gesture_usage_rate
          FROM transactions t
          LEFT JOIN request_behaviors rb ON t.id = rb.transaction_id
          WHERE t.checkout_time BETWEEN NOW() - INTERVAL '30 days' AND NOW()
          GROUP BY t.request_type
          ORDER BY total_count DESC;
        `
      });

    if (behaviorError) throw behaviorError;
    console.log(JSON.stringify(behaviorData, null, 2));

    // 4. Payment Method Analysis
    console.log('\n4️⃣ Payment Method Analysis:');
    const { data: paymentData, error: paymentError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            payment_method,
            COUNT(*) as transaction_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_transaction_value,
            AVG(checkout_seconds) as avg_checkout_time
          FROM transactions
          WHERE checkout_time BETWEEN NOW() - INTERVAL '30 days' AND NOW()
          GROUP BY payment_method
          ORDER BY transaction_count DESC;
        `
      });

    if (paymentError) throw paymentError;
    console.log(JSON.stringify(paymentData, null, 2));

    // 5. Brand Performance Snapshot
    console.log('\n5️⃣ Brand Performance Snapshot:');
    const { data: brandData, error: brandError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            p.brand,
            COUNT(DISTINCT t.id) as transaction_count,
            SUM(ti.quantity) as total_units_sold,
            SUM(ti.quantity * ti.price) as total_revenue,
            AVG(ti.price) as avg_price
          FROM transactions t
          JOIN transaction_items ti ON t.id = ti.transaction_id
          JOIN products p ON ti.product_id = p.id
          WHERE t.checkout_time BETWEEN NOW() - INTERVAL '30 days' AND NOW()
          GROUP BY p.brand
          ORDER BY total_revenue DESC
          LIMIT 10;
        `
      });

    if (brandError) throw brandError;
    console.log(JSON.stringify(brandData, null, 2));

    console.log('\n✅ Snapshot QA completed successfully!');

  } catch (error) {
    console.error('❌ Error running Snapshot QA:', error.message);
  }
}

// Run the snapshot QA
runSnapshotQA(); 