-- Debug queries to check data relationships in the retail dashboard

-- 1. Check how many transaction items are linked to products
SELECT 
  'Transaction Items with Products' as check_type,
  COUNT(*) as total_transaction_items,
  COUNT(p.id) as items_with_products,
  COUNT(*) - COUNT(p.id) as items_without_products
FROM transaction_items ti
LEFT JOIN products p ON ti.product_id = p.id;

-- 2. Check how many products are linked to brands
SELECT 
  'Products with Brands' as check_type,
  COUNT(*) as total_products,
  COUNT(b.id) as products_with_brands,
  COUNT(*) - COUNT(b.id) as products_without_brands
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id;

-- 3. Show transaction items that don't have matching products
SELECT 
  'Orphaned Transaction Items' as issue_type,
  ti.product_id,
  COUNT(*) as count
FROM transaction_items ti
LEFT JOIN products p ON ti.product_id = p.id
WHERE p.id IS NULL
GROUP BY ti.product_id
ORDER BY count DESC
LIMIT 10;

-- 4. Show products that don't have matching brands
SELECT 
  'Products without Brands' as issue_type,
  p.id,
  p.name,
  p.brand_id
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE b.id IS NULL
LIMIT 10;

-- 5. Check the actual sales by brand (what should be showing)
SELECT 
  b.name as brand_name,
  COUNT(ti.id) as transaction_count,
  SUM(ti.quantity * ti.price) as total_sales
FROM brands b
JOIN products p ON p.brand_id = b.id
JOIN transaction_items ti ON ti.product_id = p.id
GROUP BY b.id, b.name
ORDER BY total_sales DESC;

-- 6. Check if product_id and brand_id are using the correct data types
SELECT 
  'Data Types Check' as check_type,
  pg_typeof(ti.product_id) as transaction_item_product_id_type,
  pg_typeof(p.id) as product_id_type,
  pg_typeof(p.brand_id) as product_brand_id_type,
  pg_typeof(b.id) as brand_id_type
FROM transaction_items ti
JOIN products p ON ti.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LIMIT 1;
