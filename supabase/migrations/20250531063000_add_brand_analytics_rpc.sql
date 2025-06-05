-- Create the missing RPC functions
CREATE OR REPLACE FUNCTION get_brand_analytics()
RETURNS TABLE (
    brand_id INT,
    brand_name TEXT,
    total_sales DECIMAL,
    transaction_count INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as brand_id,
        b.name as brand_name,
        COALESCE(SUM(t.total_amount), 0) as total_sales,
        COUNT(DISTINCT t.id) as transaction_count
    FROM brands b
    LEFT JOIN transactions t ON t.id IN (
        SELECT DISTINCT transaction_id 
        FROM transaction_items ti 
        JOIN products p ON p.id = ti.product_id 
        WHERE p.brand_id = b.id
    )
    GROUP BY b.id, b.name
    ORDER BY total_sales DESC;
END;
$$; 