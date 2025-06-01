-- ===================================================================
-- Fix Missing Fields for Behavioral Analytics Functions
-- ===================================================================

-- Add missing fields to request_behaviors table
ALTER TABLE request_behaviors 
ADD COLUMN IF NOT EXISTS suggestion_offered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suggestion_accepted BOOLEAN DEFAULT FALSE;

-- Update existing request_behaviors records with sample data
UPDATE request_behaviors
SET 
  suggestion_offered = CASE 
    WHEN behavior_type = 'substitution' THEN TRUE
    WHEN random() < 0.3 THEN TRUE  -- 30% of other behaviors get suggestions
    ELSE FALSE
  END,
  suggestion_accepted = CASE 
    WHEN behavior_type = 'substitution' AND random() < 0.7 THEN TRUE  -- 70% acceptance for substitutions
    WHEN suggestion_offered AND random() < 0.5 THEN TRUE  -- 50% acceptance for other suggestions
    ELSE FALSE
  END
WHERE suggestion_offered IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_request_behaviors_suggestion_offered 
ON request_behaviors(suggestion_offered) 
WHERE suggestion_offered = TRUE;

CREATE INDEX IF NOT EXISTS idx_request_behaviors_suggestion_accepted 
ON request_behaviors(suggestion_accepted) 
WHERE suggestion_accepted = TRUE;

-- Verify the updates
DO $$
BEGIN
  RAISE NOTICE 'Request behaviors with suggestions offered: %', 
    (SELECT COUNT(*) FROM request_behaviors WHERE suggestion_offered = TRUE);
  RAISE NOTICE 'Request behaviors with suggestions accepted: %', 
    (SELECT COUNT(*) FROM request_behaviors WHERE suggestion_accepted = TRUE);
END $$;