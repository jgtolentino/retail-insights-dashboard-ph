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