-- Create missing chart functions for dashboard
-- Age Distribution and Gender Distribution functions

-- Age Distribution Function
CREATE OR REPLACE FUNCTION get_age_distribution(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'age_group', age_group,
        'count', count,
        'percentage', ROUND((count::NUMERIC / total_count::NUMERIC) * 100, 1)
      )
    )
    FROM (
      SELECT 
        CASE 
          WHEN age BETWEEN 18 AND 25 THEN '18-25'
          WHEN age BETWEEN 26 AND 35 THEN '26-35'
          WHEN age BETWEEN 36 AND 45 THEN '36-45'
          WHEN age BETWEEN 46 AND 55 THEN '46-55'
          WHEN age > 55 THEN '55+'
          ELSE 'Unknown'
        END as age_group,
        COUNT(*) as count,
        (SELECT COUNT(*) FROM transactions t2 
         JOIN customers c2 ON t2.customer_id = c2.id
         WHERE t2.transaction_date BETWEEN start_date AND end_date) as total_count
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.transaction_date BETWEEN start_date AND end_date
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN '18-25' THEN 1
          WHEN '26-35' THEN 2
          WHEN '36-45' THEN 3
          WHEN '46-55' THEN 4
          WHEN '55+' THEN 5
          ELSE 6
        END
    ) age_stats
  );
END;
$$ LANGUAGE plpgsql;

-- Gender Distribution Function
CREATE OR REPLACE FUNCTION get_gender_distribution(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'gender', gender,
        'count', count,
        'percentage', ROUND((count::NUMERIC / total_count::NUMERIC) * 100, 1)
      )
    )
    FROM (
      SELECT 
        COALESCE(c.gender, 'Unknown') as gender,
        COUNT(*) as count,
        (SELECT COUNT(*) FROM transactions t2 
         JOIN customers c2 ON t2.customer_id = c2.id
         WHERE t2.transaction_date BETWEEN start_date AND end_date) as total_count
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.transaction_date BETWEEN start_date AND end_date
      GROUP BY c.gender
      ORDER BY count DESC
    ) gender_stats
  );
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT 'Testing age distribution function...' as test;
SELECT get_age_distribution();

SELECT 'Testing gender distribution function...' as test;
SELECT get_gender_distribution();