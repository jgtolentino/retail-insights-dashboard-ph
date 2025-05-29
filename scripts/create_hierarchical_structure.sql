-- 🏢 COMPREHENSIVE HIERARCHICAL STRUCTURE FOR RETAIL ANALYTICS
-- This creates a complete hierarchy for drill-down functionality

-- =====================================================
-- SECTION 1: CLIENT/COMPANY HIERARCHY
-- =====================================================

-- Company Groups (Holding Companies)
CREATE TABLE IF NOT EXISTS company_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies (Operating Companies)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    company_group_id INT REFERENCES company_groups(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    business_type VARCHAR(100), -- 'manufacturer', 'distributor', 'retailer'
    is_tbwa_client BOOLEAN DEFAULT false,
    client_since DATE,
    annual_revenue DECIMAL(15,2),
    employee_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Divisions (Business Units)
CREATE TABLE IF NOT EXISTS company_divisions (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    division_type VARCHAR(100), -- 'food', 'beverage', 'personal_care', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Company Hierarchy Data
INSERT INTO company_groups (name, code, description) VALUES
('TBWA Clients', 'TBWA', 'All TBWA client companies'),
('Major Competitors', 'COMP', 'Major competing companies'),
('Local Partners', 'LOCAL', 'Local Philippine companies'),
('International Partners', 'INTL', 'International partner companies')
ON CONFLICT (code) DO NOTHING;

INSERT INTO companies (company_group_id, name, code, business_type, is_tbwa_client, client_since) VALUES
-- TBWA Clients
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Alaska Milk Corporation', 'ALASKA', 'manufacturer', true, '2015-01-01'),
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Del Monte Philippines', 'DELMONTE', 'manufacturer', true, '2018-06-01'),
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Liwayway Marketing Corp', 'OISHI', 'manufacturer', true, '2016-03-01'),
-- Major Competitors
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Nestle Philippines', 'NESTLE', 'manufacturer', false, NULL),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Unilever Philippines', 'UNILEVER', 'manufacturer', false, NULL),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Procter & Gamble', 'PG', 'manufacturer', false, NULL),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Coca-Cola Philippines', 'COKE', 'manufacturer', false, NULL),
-- Local Partners
((SELECT id FROM company_groups WHERE code = 'LOCAL'), 'San Miguel Corporation', 'SMC', 'manufacturer', false, NULL),
((SELECT id FROM company_groups WHERE code = 'LOCAL'), 'Universal Robina Corp', 'URC', 'manufacturer', false, NULL),
((SELECT id FROM company_groups WHERE code = 'LOCAL'), 'Century Pacific Food', 'CENTURY', 'manufacturer', false, NULL)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SECTION 2: PRODUCT CATEGORY HIERARCHY
-- =====================================================

-- Level 1: Product Departments
CREATE TABLE IF NOT EXISTS product_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_order INT DEFAULT 0,
    icon_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Level 2: Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    department_id INT REFERENCES product_departments(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Level 3: Product Subcategories
CREATE TABLE IF NOT EXISTS product_subcategories (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Product Category Hierarchy
INSERT INTO product_departments (name, code, display_order, icon_name) VALUES
('Food & Beverages', 'FOOD_BEV', 1, 'shopping-basket'),
('Personal Care', 'PERSONAL', 2, 'user'),
('Household', 'HOUSEHOLD', 3, 'home'),
('Tobacco & Liquor', 'VICE', 4, 'wine'),
('Telecom & Digital', 'DIGITAL', 5, 'smartphone')
ON CONFLICT (code) DO NOTHING;

INSERT INTO product_categories (department_id, name, code, display_order) VALUES
-- Food & Beverages
((SELECT id FROM product_departments WHERE code = 'FOOD_BEV'), 'Dairy Products', 'DAIRY', 1),
((SELECT id FROM product_departments WHERE code = 'FOOD_BEV'), 'Beverages', 'BEVERAGE', 2),
((SELECT id FROM product_departments WHERE code = 'FOOD_BEV'), 'Snacks', 'SNACKS', 3),
((SELECT id FROM product_departments WHERE code = 'FOOD_BEV'), 'Canned Goods', 'CANNED', 4),
((SELECT id FROM product_departments WHERE code = 'FOOD_BEV'), 'Noodles', 'NOODLES', 5),
((SELECT id FROM product_departments WHERE code = 'FOOD_BEV'), 'Condiments', 'CONDIMENT', 6),
((SELECT id FROM product_departments WHERE code = 'FOOD_BEV'), 'Bakery', 'BAKERY', 7),
-- Personal Care
((SELECT id FROM product_departments WHERE code = 'PERSONAL'), 'Bath & Body', 'BATH', 1),
((SELECT id FROM product_departments WHERE code = 'PERSONAL'), 'Oral Care', 'ORAL', 2),
((SELECT id FROM product_departments WHERE code = 'PERSONAL'), 'Hair Care', 'HAIR', 3),
-- Household
((SELECT id FROM product_departments WHERE code = 'HOUSEHOLD'), 'Laundry', 'LAUNDRY', 1),
((SELECT id FROM product_departments WHERE code = 'HOUSEHOLD'), 'Cleaning', 'CLEANING', 2),
-- Vice
((SELECT id FROM product_departments WHERE code = 'VICE'), 'Cigarettes', 'CIGARETTE', 1),
((SELECT id FROM product_departments WHERE code = 'VICE'), 'Beer', 'BEER', 2),
((SELECT id FROM product_departments WHERE code = 'VICE'), 'Spirits', 'SPIRITS', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO product_subcategories (category_id, name, code) VALUES
-- Dairy Subcategories
((SELECT id FROM product_categories WHERE code = 'DAIRY'), 'Evaporated Milk', 'EVAP_MILK'),
((SELECT id FROM product_categories WHERE code = 'DAIRY'), 'Condensed Milk', 'CONDENSED'),
((SELECT id FROM product_categories WHERE code = 'DAIRY'), 'Powdered Milk', 'POWDER_MILK'),
-- Beverage Subcategories
((SELECT id FROM product_categories WHERE code = 'BEVERAGE'), 'Carbonated Drinks', 'SODA'),
((SELECT id FROM product_categories WHERE code = 'BEVERAGE'), 'Juice Drinks', 'JUICE'),
((SELECT id FROM product_categories WHERE code = 'BEVERAGE'), 'Coffee', 'COFFEE'),
((SELECT id FROM product_categories WHERE code = 'BEVERAGE'), 'Tea', 'TEA'),
((SELECT id FROM product_categories WHERE code = 'BEVERAGE'), 'Energy Drinks', 'ENERGY'),
-- Snacks Subcategories
((SELECT id FROM product_categories WHERE code = 'SNACKS'), 'Chips', 'CHIPS'),
((SELECT id FROM product_categories WHERE code = 'SNACKS'), 'Crackers', 'CRACKERS'),
((SELECT id FROM product_categories WHERE code = 'SNACKS'), 'Cookies', 'COOKIES'),
((SELECT id FROM product_categories WHERE code = 'SNACKS'), 'Nuts', 'NUTS')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SECTION 3: ENHANCED BRAND HIERARCHY
-- =====================================================

-- Brand Tiers (Premium, Mid-range, Economy)
CREATE TABLE IF NOT EXISTS brand_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    price_index DECIMAL(5,2), -- 1.0 = average price
    description TEXT
);

-- Enhanced Brands Table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_tier_id INT REFERENCES brand_tiers(id);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS parent_brand_id INT REFERENCES brands(id);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS launch_date DATE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_flagship BOOLEAN DEFAULT false;

INSERT INTO brand_tiers (name, code, price_index, description) VALUES
('Premium', 'PREMIUM', 1.5, 'High-end premium brands'),
('Mid-Range', 'MID', 1.0, 'Standard mid-range brands'),
('Economy', 'ECONOMY', 0.7, 'Budget-friendly brands'),
('Super Economy', 'SUPER_ECO', 0.5, 'Ultra low-cost brands')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SECTION 4: ENHANCED PRODUCT/SKU STRUCTURE
-- =====================================================

-- Product Lines (Groups of related products)
CREATE TABLE IF NOT EXISTS product_lines (
    id SERIAL PRIMARY KEY,
    brand_id INT REFERENCES brands(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Products Table
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id INT REFERENCES product_subcategories(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_line_id INT REFERENCES product_lines(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_unit VARCHAR(50); -- 'piece', 'pack', 'bottle', etc.
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_size DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_measure VARCHAR(20); -- 'ml', 'g', 'oz', etc.

-- SKU Variants (Size variants of products)
CREATE TABLE IF NOT EXISTS sku_variants (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    sku_code VARCHAR(100) UNIQUE NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    size DECIMAL(10,2),
    size_unit VARCHAR(20),
    pack_size INT DEFAULT 1,
    barcode VARCHAR(50),
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SECTION 5: CUSTOMER SEGMENTATION HIERARCHY
-- =====================================================

-- Customer Segments (High-level)
CREATE TABLE IF NOT EXISTS customer_segments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    min_monthly_spend DECIMAL(10,2),
    max_monthly_spend DECIMAL(10,2)
);

-- Customer Subsegments (Detailed)
CREATE TABLE IF NOT EXISTS customer_subsegments (
    id SERIAL PRIMARY KEY,
    segment_id INT REFERENCES customer_segments(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    characteristics JSONB, -- Store demographic and behavioral characteristics
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Personas
CREATE TABLE IF NOT EXISTS customer_personas (
    id SERIAL PRIMARY KEY,
    subsegment_id INT REFERENCES customer_subsegments(id),
    name VARCHAR(100) NOT NULL,
    age_range VARCHAR(20),
    gender_preference VARCHAR(20),
    shopping_frequency VARCHAR(50),
    preferred_categories TEXT[],
    price_sensitivity VARCHAR(20), -- 'high', 'medium', 'low'
    brand_loyalty VARCHAR(20), -- 'high', 'medium', 'low'
    typical_basket_size INT,
    preferred_payment VARCHAR(50),
    shopping_time_preference VARCHAR(50),
    description TEXT
);

-- Insert Customer Segmentation Data
INSERT INTO customer_segments (name, code, description, min_monthly_spend, max_monthly_spend) VALUES
('Premium Shoppers', 'PREMIUM', 'High-spending customers with brand preferences', 10000, 999999),
('Regular Families', 'REGULAR', 'Middle-income families with steady purchases', 3000, 9999),
('Budget Conscious', 'BUDGET', 'Price-sensitive customers seeking value', 1000, 2999),
('Subsistence', 'SUBSIST', 'Daily wage earners with minimal spending', 0, 999)
ON CONFLICT (code) DO NOTHING;

INSERT INTO customer_subsegments (segment_id, name, code, characteristics) VALUES
-- Premium Subsegments
((SELECT id FROM customer_segments WHERE code = 'PREMIUM'), 'Urban Professionals', 'URBAN_PRO', 
 '{"age": "25-45", "education": "college+", "lifestyle": "convenience-focused"}'::jsonb),
((SELECT id FROM customer_segments WHERE code = 'PREMIUM'), 'Affluent Families', 'AFFLUENT_FAM',
 '{"age": "35-55", "household_size": "4+", "lifestyle": "quality-focused"}'::jsonb),
-- Regular Subsegments
((SELECT id FROM customer_segments WHERE code = 'REGULAR'), 'Young Families', 'YOUNG_FAM',
 '{"age": "25-35", "children": "1-2", "lifestyle": "growing-family"}'::jsonb),
((SELECT id FROM customer_segments WHERE code = 'REGULAR'), 'Established Households', 'ESTAB_HOUSE',
 '{"age": "35-50", "children": "2+", "lifestyle": "stable-routine"}'::jsonb),
-- Budget Subsegments
((SELECT id FROM customer_segments WHERE code = 'BUDGET'), 'Senior Citizens', 'SENIOR',
 '{"age": "60+", "lifestyle": "fixed-income", "health_conscious": true}'::jsonb),
((SELECT id FROM customer_segments WHERE code = 'BUDGET'), 'Students', 'STUDENT',
 '{"age": "18-24", "lifestyle": "budget-limited", "convenience": "high"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SECTION 6: LOCATION HIERARCHY ENHANCEMENT
-- =====================================================

-- Location Groups (Island Groups)
CREATE TABLE IF NOT EXISTS location_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_order INT DEFAULT 0
);

-- Link Regions to Island Groups
ALTER TABLE location_hierarchy ADD COLUMN IF NOT EXISTS location_group_id INT REFERENCES location_groups(id);

INSERT INTO location_groups (name, code, display_order) VALUES
('Luzon', 'LUZON', 1),
('Visayas', 'VISAYAS', 2),
('Mindanao', 'MINDANAO', 3)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SECTION 7: STORE CLASSIFICATION HIERARCHY
-- =====================================================

-- Store Classifications
CREATE TABLE IF NOT EXISTS store_classifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    typical_sku_count INT,
    typical_daily_transactions INT,
    description TEXT
);

-- Store Formats
CREATE TABLE IF NOT EXISTS store_formats (
    id SERIAL PRIMARY KEY,
    classification_id INT REFERENCES store_classifications(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    min_size_sqm INT,
    max_size_sqm INT
);

INSERT INTO store_classifications (name, code, typical_sku_count, typical_daily_transactions) VALUES
('Traditional Trade', 'TRAD', 50, 100),
('Modern Trade', 'MODERN', 500, 300),
('E-Commerce', 'ECOMM', 1000, 200)
ON CONFLICT (code) DO NOTHING;

INSERT INTO store_formats (classification_id, name, code, min_size_sqm, max_size_sqm) VALUES
-- Traditional Trade
((SELECT id FROM store_classifications WHERE code = 'TRAD'), 'Sari-Sari Store', 'SARI', 5, 20),
((SELECT id FROM store_classifications WHERE code = 'TRAD'), 'Carinderia', 'CARINDERIA', 20, 50),
((SELECT id FROM store_classifications WHERE code = 'TRAD'), 'Market Stall', 'MARKET', 10, 30),
-- Modern Trade
((SELECT id FROM store_classifications WHERE code = 'MODERN'), 'Convenience Store', 'CONV', 50, 150),
((SELECT id FROM store_classifications WHERE code = 'MODERN'), 'Mini Mart', 'MINI', 150, 300),
((SELECT id FROM store_classifications WHERE code = 'MODERN'), 'Supermarket', 'SUPER', 300, 1000)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SECTION 8: DRILL-DOWN VIEWS AND FUNCTIONS
-- =====================================================

-- Create hierarchical product view
CREATE OR REPLACE VIEW v_product_hierarchy AS
SELECT 
    pd.name as department,
    pd.code as department_code,
    pc.name as category,
    pc.code as category_code,
    ps.name as subcategory,
    ps.code as subcategory_code,
    b.name as brand,
    p.name as product,
    p.sku,
    sv.sku_code as variant_sku,
    sv.variant_name,
    sv.price
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_subcategories ps ON p.subcategory_id = ps.id
LEFT JOIN product_categories pc ON ps.category_id = pc.id
LEFT JOIN product_departments pd ON pc.department_id = pd.id
LEFT JOIN sku_variants sv ON sv.product_id = p.id;

-- Create customer hierarchy view
CREATE OR REPLACE VIEW v_customer_hierarchy AS
SELECT 
    cs.name as segment,
    cs.code as segment_code,
    css.name as subsegment,
    css.code as subsegment_code,
    cp.name as persona,
    cp.age_range,
    cp.shopping_frequency,
    cp.price_sensitivity,
    cp.brand_loyalty
FROM customer_personas cp
JOIN customer_subsegments css ON cp.subsegment_id = css.id
JOIN customer_segments cs ON css.segment_id = cs.id;

-- Create location hierarchy view
CREATE OR REPLACE VIEW v_location_hierarchy AS
SELECT 
    lg.name as island_group,
    lh.region,
    lh.province,
    lh.city_municipality,
    lh.barangay,
    lh.urban_rural,
    lh.population
FROM location_hierarchy lh
LEFT JOIN location_groups lg ON lh.location_group_id = lg.id
ORDER BY lg.display_order, lh.region, lh.province, lh.city_municipality, lh.barangay;

-- =====================================================
-- SECTION 9: DRILL-DOWN ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get sales by any hierarchy level
CREATE OR REPLACE FUNCTION get_hierarchical_sales(
    p_hierarchy_type VARCHAR, -- 'product', 'location', 'customer', 'time'
    p_level VARCHAR, -- 'department', 'category', 'subcategory', 'brand', 'product'
    p_filters JSONB DEFAULT '{}'::jsonb,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    hierarchy_value VARCHAR,
    total_revenue DECIMAL,
    transaction_count BIGINT,
    unique_customers BIGINT,
    avg_basket_size DECIMAL
) AS $$
BEGIN
    -- Implementation would vary based on hierarchy type
    -- This is a simplified example for product hierarchy
    IF p_hierarchy_type = 'product' THEN
        IF p_level = 'department' THEN
            RETURN QUERY
            SELECT 
                pd.name::VARCHAR,
                SUM(ti.price * ti.quantity)::DECIMAL,
                COUNT(DISTINCT t.id)::BIGINT,
                COUNT(DISTINCT t.customer_id)::BIGINT,
                AVG(t.amount)::DECIMAL
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            LEFT JOIN product_subcategories ps ON p.subcategory_id = ps.id
            LEFT JOIN product_categories pc ON ps.category_id = pc.id
            LEFT JOIN product_departments pd ON pc.department_id = pd.id
            WHERE t.created_at BETWEEN p_start_date AND p_end_date
            GROUP BY pd.name;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 10: SAMPLE DATA RELATIONSHIPS
-- =====================================================

-- Update existing brands with company relationships
UPDATE brands b
SET company_id = c.id
FROM companies c
WHERE 
    (b.name ILIKE '%Alaska%' AND c.code = 'ALASKA') OR
    (b.name ILIKE '%Del Monte%' AND c.code = 'DELMONTE') OR
    (b.name ILIKE '%Oishi%' AND c.code = 'OISHI') OR
    (b.name ILIKE '%Nestle%' AND c.code = 'NESTLE') OR
    (b.name ILIKE '%Coca%' AND c.code = 'COKE');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_brands_company ON brands(company_id);
CREATE INDEX IF NOT EXISTS idx_customer_hierarchy ON location_hierarchy(region, province, city_municipality, barangay);
CREATE INDEX IF NOT EXISTS idx_sku_variants_product ON sku_variants(product_id);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

SELECT 
    'Hierarchical Structure Summary' as report_type,
    (SELECT COUNT(*) FROM company_groups) as company_groups,
    (SELECT COUNT(*) FROM companies) as companies,
    (SELECT COUNT(*) FROM product_departments) as departments,
    (SELECT COUNT(*) FROM product_categories) as categories,
    (SELECT COUNT(*) FROM product_subcategories) as subcategories,
    (SELECT COUNT(*) FROM customer_segments) as customer_segments,
    (SELECT COUNT(*) FROM customer_personas) as customer_personas,
    (SELECT COUNT(*) FROM location_groups) as island_groups,
    (SELECT COUNT(*) FROM store_classifications) as store_types;