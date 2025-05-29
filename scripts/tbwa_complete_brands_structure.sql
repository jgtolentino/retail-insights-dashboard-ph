-- 🏢 COMPLETE TBWA CLIENT BRANDS & COMPETITORS STRUCTURE
-- Comprehensive brand portfolio with all products and competitors

-- =====================================================
-- SECTION 1: EXPAND COMPANY STRUCTURE
-- =====================================================

-- Clear and rebuild company data with complete portfolio
DELETE FROM companies WHERE code IN ('ALASKA', 'OISHI', 'DELMONTE', 'PEERLESS', 'JTI');

INSERT INTO companies (company_group_id, name, code, business_type, is_tbwa_client, client_since, annual_revenue) VALUES
-- TBWA Clients (Complete List)
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Alaska Milk Corporation', 'ALASKA', 'manufacturer', true, '2015-01-01', 15000000000),
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Liwayway Marketing Corporation', 'LIWAYWAY', 'manufacturer', true, '2016-03-01', 8000000000),
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Peerless Products Manufacturing Corporation', 'PEERLESS', 'manufacturer', true, '2017-06-01', 3000000000),
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Del Monte Philippines Inc', 'DELMONTE', 'manufacturer', true, '2018-06-01', 12000000000),
((SELECT id FROM company_groups WHERE code = 'TBWA'), 'Japan Tobacco International', 'JTI', 'manufacturer', true, '2019-01-01', 25000000000)
ON CONFLICT (code) DO NOTHING;

-- Add Major Competitors for each category
INSERT INTO companies (company_group_id, name, code, business_type, is_tbwa_client) VALUES
-- Dairy Competitors (vs Alaska)
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Nestle Philippines - Dairy', 'NESTLE_DAIRY', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Friesland Campina', 'FRIESLAND', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Fonterra Brands', 'FONTERRA', 'manufacturer', false),
-- Snacks Competitors (vs Oishi)
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Jack n Jill (URC)', 'JACKNJILL', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Regent Foods Corporation', 'REGENT', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Ricoa (Malagos)', 'RICOA', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Frito-Lay Philippines', 'FRITOLAY', 'manufacturer', false),
-- Cleaning Products Competitors (vs Peerless)
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Unilever Home Care', 'UNILEVER_HC', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'P&G Home Care', 'PG_HC', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'SC Johnson', 'SCJOHNSON', 'manufacturer', false),
-- Food Competitors (vs Del Monte)
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Mega Global Corporation', 'MEGA', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'CDO Foodsphere', 'CDO', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Ram Food Products', 'RAM', 'manufacturer', false),
-- Tobacco Competitors (vs JTI)
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Philip Morris Philippines', 'PMI', 'manufacturer', false),
((SELECT id FROM company_groups WHERE code = 'COMP'), 'Fortune Tobacco Corporation', 'FORTUNE', 'manufacturer', false)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SECTION 2: COMPLETE BRAND PORTFOLIO
-- =====================================================

-- Clear existing brands to avoid duplicates
DELETE FROM brands WHERE company_id IN (SELECT id FROM companies WHERE is_tbwa_client = true);

-- ALASKA MILK CORPORATION BRANDS
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
-- Main Alaska Brands
('Alaska', (SELECT id FROM companies WHERE code = 'ALASKA'), 'Dairy', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Alpine', (SELECT id FROM companies WHERE code = 'ALASKA'), 'Dairy', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Cow Bell', (SELECT id FROM companies WHERE code = 'ALASKA'), 'Dairy', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Krem-Top', (SELECT id FROM companies WHERE code = 'ALASKA'), 'Dairy', true, (SELECT id FROM brand_tiers WHERE code = 'MID'));

-- OISHI/LIWAYWAY BRANDS
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Oishi', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Snacks', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Smart C+', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Beverages', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Gourmet Picks', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Snacks', true, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Crispy Patata', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Snacks', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Oaties', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Snacks', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Hi-Ho', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Snacks', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Rinbee', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Snacks', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Deli Mex', (SELECT id FROM companies WHERE code = 'LIWAYWAY'), 'Snacks', true, (SELECT id FROM brand_tiers WHERE code = 'MID'));

-- PEERLESS BRANDS
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Champion', (SELECT id FROM companies WHERE code = 'PEERLESS'), 'Household', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Calla', (SELECT id FROM companies WHERE code = 'PEERLESS'), 'Personal Care', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Hana', (SELECT id FROM companies WHERE code = 'PEERLESS'), 'Personal Care', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Cyclone', (SELECT id FROM companies WHERE code = 'PEERLESS'), 'Household', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Pride', (SELECT id FROM companies WHERE code = 'PEERLESS'), 'Household', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Care Plus', (SELECT id FROM companies WHERE code = 'PEERLESS'), 'Personal Care', true, (SELECT id FROM brand_tiers WHERE code = 'MID'));

-- DEL MONTE BRANDS
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Del Monte', (SELECT id FROM companies WHERE code = 'DELMONTE'), 'Food', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('S&W', (SELECT id FROM companies WHERE code = 'DELMONTE'), 'Food', true, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Today''s', (SELECT id FROM companies WHERE code = 'DELMONTE'), 'Food', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Fit ''n Right', (SELECT id FROM companies WHERE code = 'DELMONTE'), 'Beverages', true, (SELECT id FROM brand_tiers WHERE code = 'MID'));

-- JTI BRANDS
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Winston', (SELECT id FROM companies WHERE code = 'JTI'), 'Tobacco', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Camel', (SELECT id FROM companies WHERE code = 'JTI'), 'Tobacco', true, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Mevius', (SELECT id FROM companies WHERE code = 'JTI'), 'Tobacco', true, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('LD', (SELECT id FROM companies WHERE code = 'JTI'), 'Tobacco', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Mighty', (SELECT id FROM companies WHERE code = 'JTI'), 'Tobacco', true, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Caster', (SELECT id FROM companies WHERE code = 'JTI'), 'Tobacco', true, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Glamour', (SELECT id FROM companies WHERE code = 'JTI'), 'Tobacco', true, (SELECT id FROM brand_tiers WHERE code = 'MID'));

-- =====================================================
-- SECTION 3: COMPETITOR BRANDS
-- =====================================================

-- Dairy Competitors (vs Alaska)
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Bear Brand', (SELECT id FROM companies WHERE code = 'NESTLE_DAIRY'), 'Dairy', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Nido', (SELECT id FROM companies WHERE code = 'NESTLE_DAIRY'), 'Dairy', false, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Carnation', (SELECT id FROM companies WHERE code = 'NESTLE_DAIRY'), 'Dairy', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Anchor', (SELECT id FROM companies WHERE code = 'FONTERRA'), 'Dairy', false, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Birch Tree', (SELECT id FROM companies WHERE code = 'FRIESLAND'), 'Dairy', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Jolly Cow', (SELECT id FROM companies WHERE code = 'FRIESLAND'), 'Dairy', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY'));

-- Snacks Competitors (vs Oishi)
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Jack ''n Jill', (SELECT id FROM companies WHERE code = 'JACKNJILL'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Piattos', (SELECT id FROM companies WHERE code = 'JACKNJILL'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Nova', (SELECT id FROM companies WHERE code = 'JACKNJILL'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Chippy', (SELECT id FROM companies WHERE code = 'JACKNJILL'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Regent', (SELECT id FROM companies WHERE code = 'REGENT'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Tempura', (SELECT id FROM companies WHERE code = 'REGENT'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Lays', (SELECT id FROM companies WHERE code = 'FRITOLAY'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Doritos', (SELECT id FROM companies WHERE code = 'FRITOLAY'), 'Snacks', false, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM'));

-- Household/Personal Care Competitors (vs Peerless)
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Surf', (SELECT id FROM companies WHERE code = 'UNILEVER_HC'), 'Household', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Breeze', (SELECT id FROM companies WHERE code = 'UNILEVER_HC'), 'Household', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Downy', (SELECT id FROM companies WHERE code = 'PG_HC'), 'Household', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Ariel', (SELECT id FROM companies WHERE code = 'PG_HC'), 'Household', false, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Tide', (SELECT id FROM companies WHERE code = 'PG_HC'), 'Household', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Joy', (SELECT id FROM companies WHERE code = 'PG_HC'), 'Household', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Zonrox', (SELECT id FROM companies WHERE code = 'SCJOHNSON'), 'Household', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY'));

-- Food Competitors (vs Del Monte)
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Mega Sardines', (SELECT id FROM companies WHERE code = 'MEGA'), 'Food', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('CDO', (SELECT id FROM companies WHERE code = 'CDO'), 'Food', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Ram', (SELECT id FROM companies WHERE code = 'RAM'), 'Food', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('UFC', (SELECT id FROM companies WHERE code = 'MEGA'), 'Food', false, (SELECT id FROM brand_tiers WHERE code = 'MID')),
('Hunt''s', (SELECT id FROM companies WHERE code = 'MEGA'), 'Food', false, (SELECT id FROM brand_tiers WHERE code = 'MID'));

-- Tobacco Competitors (vs JTI)
INSERT INTO brands (name, company_id, category, is_tbwa_client, brand_tier_id) VALUES
('Marlboro', (SELECT id FROM companies WHERE code = 'PMI'), 'Tobacco', false, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Philip Morris', (SELECT id FROM companies WHERE code = 'PMI'), 'Tobacco', false, (SELECT id FROM brand_tiers WHERE code = 'PREMIUM')),
('Fortune', (SELECT id FROM companies WHERE code = 'FORTUNE'), 'Tobacco', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('Hope', (SELECT id FROM companies WHERE code = 'FORTUNE'), 'Tobacco', false, (SELECT id FROM brand_tiers WHERE code = 'ECONOMY')),
('More', (SELECT id FROM companies WHERE code = 'FORTUNE'), 'Tobacco', false, (SELECT id FROM brand_tiers WHERE code = 'MID'));

-- =====================================================
-- SECTION 4: COMPLETE PRODUCT LINES
-- =====================================================

-- Alaska Product Lines
INSERT INTO product_lines (brand_id, name, code, description) VALUES
((SELECT id FROM brands WHERE name = 'Alaska' AND company_id = (SELECT id FROM companies WHERE code = 'ALASKA')), 
 'Alaska Evaporated Milk', 'ALASKA_EVAP', 'Full range of evaporated milk products'),
((SELECT id FROM brands WHERE name = 'Alaska' AND company_id = (SELECT id FROM companies WHERE code = 'ALASKA')), 
 'Alaska Condensed Milk', 'ALASKA_CONDENSED', 'Sweetened condensed milk products'),
((SELECT id FROM brands WHERE name = 'Alaska' AND company_id = (SELECT id FROM companies WHERE code = 'ALASKA')), 
 'Alaska Powdered Milk', 'ALASKA_POWDER', 'Instant powdered milk products');

-- Oishi Product Lines
INSERT INTO product_lines (brand_id, name, code, description) VALUES
((SELECT id FROM brands WHERE name = 'Oishi' AND company_id = (SELECT id FROM companies WHERE code = 'LIWAYWAY')), 
 'Oishi Prawn Crackers', 'OISHI_PRAWN', 'Signature prawn cracker line'),
((SELECT id FROM brands WHERE name = 'Oishi' AND company_id = (SELECT id FROM companies WHERE code = 'LIWAYWAY')), 
 'Oishi Pillows', 'OISHI_PILLOWS', 'Filled snack pillows'),
((SELECT id FROM brands WHERE name = 'Oishi' AND company_id = (SELECT id FROM companies WHERE code = 'LIWAYWAY')), 
 'Oishi Ridges', 'OISHI_RIDGES', 'Ridge-cut potato chips'),
((SELECT id FROM brands WHERE name = 'Oishi' AND company_id = (SELECT id FROM companies WHERE code = 'LIWAYWAY')), 
 'Oishi Marty''s', 'OISHI_MARTYS', 'Vegetable chips line'),
((SELECT id FROM brands WHERE name = 'Oishi' AND company_id = (SELECT id FROM companies WHERE code = 'LIWAYWAY')), 
 'Oishi Bread Pan', 'OISHI_BREADPAN', 'Toasted bread snacks');

-- Del Monte Product Lines
INSERT INTO product_lines (brand_id, name, code, description) VALUES
((SELECT id FROM brands WHERE name = 'Del Monte' AND company_id = (SELECT id FROM companies WHERE code = 'DELMONTE')), 
 'Del Monte Pineapple', 'DM_PINEAPPLE', 'Pineapple products - juice, chunks, slices'),
((SELECT id FROM brands WHERE name = 'Del Monte' AND company_id = (SELECT id FROM companies WHERE code = 'DELMONTE')), 
 'Del Monte Tomato Products', 'DM_TOMATO', 'Ketchup and tomato sauce'),
((SELECT id FROM brands WHERE name = 'Del Monte' AND company_id = (SELECT id FROM companies WHERE code = 'DELMONTE')), 
 'Del Monte Pasta', 'DM_PASTA', 'Pasta and spaghetti sauces'),
((SELECT id FROM brands WHERE name = 'Del Monte' AND company_id = (SELECT id FROM companies WHERE code = 'DELMONTE')), 
 'Del Monte Fruit Cocktail', 'DM_COCKTAIL', 'Mixed fruit products');

-- =====================================================
-- SECTION 5: DETAILED PRODUCTS WITH SKU VARIANTS
-- =====================================================

-- Function to create products with multiple SKU variants
CREATE OR REPLACE FUNCTION create_product_with_skus(
    p_brand_name VARCHAR,
    p_product_name VARCHAR,
    p_sku_base VARCHAR,
    p_subcategory_code VARCHAR,
    p_product_line_name VARCHAR,
    p_base_price DECIMAL,
    p_sizes TEXT[] DEFAULT ARRAY['small', 'medium', 'large']
)
RETURNS VOID AS $$
DECLARE
    v_brand_id INT;
    v_product_id INT;
    v_subcategory_id INT;
    v_product_line_id INT;
    v_size TEXT;
    v_price_multiplier DECIMAL;
BEGIN
    -- Get IDs
    SELECT id INTO v_brand_id FROM brands WHERE name = p_brand_name LIMIT 1;
    SELECT id INTO v_subcategory_id FROM product_subcategories WHERE code = p_subcategory_code;
    SELECT id INTO v_product_line_id FROM product_lines WHERE name = p_product_line_name;
    
    -- Create base product
    INSERT INTO products (brand_id, name, sku, price, subcategory_id, product_line_id)
    VALUES (v_brand_id, p_product_name, p_sku_base, p_base_price, v_subcategory_id, v_product_line_id)
    RETURNING id INTO v_product_id;
    
    -- Create SKU variants
    FOREACH v_size IN ARRAY p_sizes
    LOOP
        v_price_multiplier := CASE v_size
            WHEN 'small' THEN 0.7
            WHEN 'medium' THEN 1.0
            WHEN 'large' THEN 1.5
            WHEN 'family' THEN 2.0
            ELSE 1.0
        END;
        
        INSERT INTO sku_variants (product_id, sku_code, variant_name, price)
        VALUES (
            v_product_id,
            p_sku_base || '_' || UPPER(LEFT(v_size, 1)),
            p_product_name || ' - ' || INITCAP(v_size),
            p_base_price * v_price_multiplier
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create all TBWA client products with variants
DO $$
BEGIN
    -- Alaska Products
    PERFORM create_product_with_skus('Alaska', 'Alaska Evap Milk', 'ALK_EVAP', 'EVAP_MILK', 
                                    'Alaska Evaporated Milk', 38, ARRAY['155ml', '370ml', '410ml']);
    PERFORM create_product_with_skus('Alaska', 'Alaska Condensada', 'ALK_COND', 'CONDENSED', 
                                    'Alaska Condensed Milk', 42, ARRAY['300ml', '390ml']);
    PERFORM create_product_with_skus('Alaska', 'Alaska Powdered Milk', 'ALK_PWD', 'POWDER_MILK', 
                                    'Alaska Powdered Milk', 95, ARRAY['150g', '300g', '900g', '2kg']);
    
    -- Oishi Products
    PERFORM create_product_with_skus('Oishi', 'Oishi Prawn Crackers Original', 'OSH_PRAWN', 'CHIPS', 
                                    'Oishi Prawn Crackers', 20, ARRAY['60g', '90g', '200g']);
    PERFORM create_product_with_skus('Oishi', 'Oishi Pillows Choco', 'OSH_PILL_CHO', 'CHIPS', 
                                    'Oishi Pillows', 25, ARRAY['38g', '150g']);
    PERFORM create_product_with_skus('Oishi', 'Oishi Ridges Cheese', 'OSH_RIDG', 'CHIPS', 
                                    'Oishi Ridges', 35, ARRAY['50g', '85g', '185g']);
    
    -- Peerless Products
    PERFORM create_product_with_skus('Champion', 'Champion Detergent Bar', 'CHAMP_BAR', 'LAUNDRY', 
                                    NULL, 15, ARRAY['125g', '350g']);
    PERFORM create_product_with_skus('Champion', 'Champion Powder', 'CHAMP_PWD', 'LAUNDRY', 
                                    NULL, 35, ARRAY['500g', '1kg', '2kg']);
    PERFORM create_product_with_skus('Pride', 'Pride Dishwashing Liquid', 'PRIDE_DISH', 'CLEANING', 
                                    NULL, 25, ARRAY['250ml', '500ml', '1L']);
    
    -- Del Monte Products
    PERFORM create_product_with_skus('Del Monte', 'Del Monte Pineapple Juice', 'DM_PINE_J', 'JUICE', 
                                    'Del Monte Pineapple', 35, ARRAY['240ml', '1L', '1.35L']);
    PERFORM create_product_with_skus('Del Monte', 'Del Monte Tomato Sauce', 'DM_TOM_S', 'CONDIMENT', 
                                    'Del Monte Tomato Products', 28, ARRAY['250g', '500g', '1kg']);
    PERFORM create_product_with_skus('Del Monte', 'Del Monte Spaghetti Sauce Sweet', 'DM_SPAG', 'CONDIMENT', 
                                    'Del Monte Pasta', 55, ARRAY['250g', '500g', '1kg']);
    
    -- JTI Products
    PERFORM create_product_with_skus('Winston', 'Winston Red', 'WIN_RED', 'CIGARETTE', 
                                    NULL, 145, ARRAY['20s']);
    PERFORM create_product_with_skus('Camel', 'Camel Filters', 'CAM_FIL', 'CIGARETTE', 
                                    NULL, 160, ARRAY['20s']);
    PERFORM create_product_with_skus('Mighty', 'Mighty Red', 'MIGHTY_R', 'CIGARETTE', 
                                    NULL, 95, ARRAY['20s']);
END $$;

-- =====================================================
-- SECTION 6: CREATE ANALYTICS VIEWS
-- =====================================================

-- TBWA vs Competitors Performance View
CREATE OR REPLACE VIEW v_tbwa_vs_competitors AS
SELECT 
    cg.name as company_group,
    c.name as company,
    c.is_tbwa_client,
    b.name as brand,
    bt.name as brand_tier,
    b.category,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT sv.id) as sku_count
FROM company_groups cg
JOIN companies c ON cg.id = c.company_group_id
JOIN brands b ON c.id = b.company_id
LEFT JOIN brand_tiers bt ON b.brand_tier_id = bt.id
LEFT JOIN products p ON b.id = p.brand_id
LEFT JOIN sku_variants sv ON p.id = sv.product_id
GROUP BY cg.name, c.name, c.is_tbwa_client, b.name, bt.name, b.category
ORDER BY c.is_tbwa_client DESC, company, brand;

-- Product Hierarchy Drill-Down View
CREATE OR REPLACE VIEW v_complete_product_hierarchy AS
SELECT 
    cg.name as company_group,
    c.name as company,
    c.is_tbwa_client,
    b.name as brand,
    pl.name as product_line,
    pd.name as department,
    pc.name as category,
    ps.name as subcategory,
    p.name as product,
    sv.variant_name,
    sv.sku_code,
    sv.price,
    bt.name as brand_tier,
    bt.price_index
FROM products p
JOIN brands b ON p.brand_id = b.id
JOIN companies c ON b.company_id = c.id
JOIN company_groups cg ON c.company_group_id = cg.id
LEFT JOIN brand_tiers bt ON b.brand_tier_id = bt.id
LEFT JOIN product_lines pl ON p.product_line_id = pl.id
LEFT JOIN product_subcategories ps ON p.subcategory_id = ps.id
LEFT JOIN product_categories pc ON ps.category_id = pc.id
LEFT JOIN product_departments pd ON pc.department_id = pd.id
LEFT JOIN sku_variants sv ON sv.product_id = p.id
ORDER BY c.is_tbwa_client DESC, company, brand, product, sv.price;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 
    'TBWA Client Portfolio Summary' as report_type,
    COUNT(DISTINCT CASE WHEN c.is_tbwa_client THEN c.id END) as tbwa_companies,
    COUNT(DISTINCT CASE WHEN c.is_tbwa_client THEN b.id END) as tbwa_brands,
    COUNT(DISTINCT CASE WHEN c.is_tbwa_client THEN p.id END) as tbwa_products,
    COUNT(DISTINCT CASE WHEN NOT c.is_tbwa_client THEN c.id END) as competitor_companies,
    COUNT(DISTINCT CASE WHEN NOT c.is_tbwa_client THEN b.id END) as competitor_brands,
    COUNT(DISTINCT CASE WHEN NOT c.is_tbwa_client THEN p.id END) as competitor_products
FROM companies c
LEFT JOIN brands b ON c.id = b.company_id
LEFT JOIN products p ON b.id = p.brand_id;

-- Show brand distribution by company
SELECT 
    c.name as company,
    c.is_tbwa_client,
    STRING_AGG(DISTINCT b.name, ', ' ORDER BY b.name) as brands,
    COUNT(DISTINCT b.id) as brand_count
FROM companies c
JOIN brands b ON c.id = b.company_id
WHERE c.is_tbwa_client = true
GROUP BY c.name, c.is_tbwa_client
ORDER BY c.is_tbwa_client DESC, c.name;