-- Add missing category column to products table
-- This will prevent any 400 errors if components try to query products.category

-- Add category column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Populate the category column from the related brands table
UPDATE products 
SET category = brands.category
FROM brands 
WHERE products.brand_id = brands.id 
AND products.category IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Add constraint to keep it in sync (optional)
-- This ensures category is always consistent with brand
CREATE OR REPLACE FUNCTION sync_product_category()
RETURNS TRIGGER AS $$
BEGIN
  -- When brand_id changes, update category
  IF NEW.brand_id IS DISTINCT FROM OLD.brand_id THEN
    SELECT category INTO NEW.category 
    FROM brands 
    WHERE id = NEW.brand_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync category
DROP TRIGGER IF EXISTS trigger_sync_product_category ON products;
CREATE TRIGGER trigger_sync_product_category
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_category();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added category column to products table';
  RAISE NOTICE '📊 Categories synced from brands table';
  RAISE NOTICE '🔄 Auto-sync trigger created';
END
$$;