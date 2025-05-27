-- Import 2000 transactions into Supabase
-- This script handles the UUID conversion required by Supabase

-- OPTION 1: Clear all existing data and start fresh
-- Uncomment these lines if you want to replace all data
/*
TRUNCATE TABLE transaction_items CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE brands CASCADE;
*/

-- OPTION 2: Just clear transactions (keep brands/products)
TRUNCATE TABLE transaction_items CASCADE;
TRUNCATE TABLE transactions CASCADE;

-- Create temporary tables for import
CREATE TEMP TABLE temp_transactions (
    id INTEGER,
    created_at TIMESTAMP,
    total_amount DECIMAL(10,2),
    customer_age INTEGER,
    customer_gender VARCHAR(10),
    store_location VARCHAR(50)
);

CREATE TEMP TABLE temp_transaction_items (
    id INTEGER,
    transaction_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price DECIMAL(10,2)
);

-- Import CSV data into temporary tables
-- NOTE: You'll need to upload these via Supabase dashboard or use COPY command
-- For Supabase dashboard: Table Editor > Import CSV

-- If using psql directly:
-- \COPY temp_transactions FROM 'transactions_2000.csv' WITH CSV HEADER;
-- \COPY temp_transaction_items FROM 'transaction_items_2000.csv' WITH CSV HEADER;

-- Create mapping table for integer IDs to UUIDs
CREATE TEMP TABLE transaction_id_map (
    old_id INTEGER,
    new_id UUID DEFAULT gen_random_uuid()
);

-- Generate UUID mappings for all transactions
INSERT INTO transaction_id_map (old_id)
SELECT DISTINCT id FROM temp_transactions;

-- Import transactions with UUID conversion
INSERT INTO transactions (id, created_at, transaction_date, total_amount, items_count)
SELECT 
    m.new_id,
    t.created_at,
    t.created_at::date,
    t.total_amount,
    (SELECT COUNT(*) FROM temp_transaction_items ti WHERE ti.transaction_id = t.id)
FROM temp_transactions t
JOIN transaction_id_map m ON t.id = m.old_id;

-- Import transaction items with UUID conversion
INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal)
SELECT 
    m.new_id,
    p.id,
    ti.quantity,
    ti.price,
    ti.quantity * ti.price
FROM temp_transaction_items ti
JOIN transaction_id_map m ON ti.transaction_id = m.old_id
JOIN products p ON p.id::text LIKE '%' || ti.product_id || '%'
WHERE EXISTS (SELECT 1 FROM products WHERE id::text LIKE '%' || ti.product_id || '%');

-- Verify the import
SELECT 
    'Import Summary' as report,
    COUNT(DISTINCT t.id) as total_transactions,
    COUNT(ti.id) as total_items,
    MIN(t.transaction_date) as earliest_date,
    MAX(t.transaction_date) as latest_date,
    SUM(t.total_amount) as total_revenue
FROM transactions t
LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
WHERE t.created_at >= '2025-01-01';

-- Check brand performance
SELECT 
    b.name,
    COUNT(DISTINCT ti.transaction_id) as transactions,
    SUM(ti.quantity) as units_sold,
    SUM(ti.subtotal) as revenue
FROM brands b
JOIN products p ON b.id = p.brand_id
JOIN transaction_items ti ON p.id = ti.product_id
JOIN transactions t ON ti.transaction_id = t.id
WHERE t.created_at >= '2025-01-01'
GROUP BY b.id, b.name
ORDER BY revenue DESC;