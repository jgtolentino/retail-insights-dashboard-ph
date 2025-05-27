-- Fix RLS policies for Sprint 2: Product Mix & SKU Analysis

-- 1) Enable RLS on all required tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 2) Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public read brands" ON public.brands;
DROP POLICY IF EXISTS "Allow public read transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "Allow public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public read stores" ON public.stores;

-- 3) Create public read policies for all tables
CREATE POLICY "Allow public read products"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read brands"
  ON public.brands
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read transaction_items"
  ON public.transaction_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read transactions"
  ON public.transactions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read stores"
  ON public.stores
  FOR SELECT
  USING (true);

-- 4) Verify the policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'brands', 'transaction_items', 'transactions', 'stores')
ORDER BY tablename, policyname;

-- 5) Test access to products table
SELECT COUNT(*) as product_count FROM public.products;
SELECT COUNT(*) as brand_count FROM public.brands;
SELECT COUNT(*) as transaction_count FROM public.transactions;
SELECT COUNT(*) as transaction_items_count FROM public.transaction_items;