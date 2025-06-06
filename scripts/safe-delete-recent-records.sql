-- Safe Deletion of 2 Most Recent Transaction Records
-- Identified records: transaction IDs 18973 and 18466
-- Date: 2025-06-06
-- Purpose: Clean up 2 most recent records as requested

-- BACKUP STEP: Create backup of records before deletion
-- This allows recovery if needed

-- 1. Create backup table for the records we're about to delete
CREATE TABLE IF NOT EXISTS deleted_transactions_backup (
    id INTEGER,
    customer_id INTEGER,
    store_id INTEGER,
    total DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    backup_reason TEXT DEFAULT 'Manual cleanup - 2 most recent records'
);

-- 2. Backup the transactions we're about to delete
INSERT INTO deleted_transactions_backup (id, customer_id, store_id, total, created_at)
SELECT id, customer_id, store_id, total, created_at
FROM transactions 
WHERE id IN (18973, 18466);

-- 3. Backup related transaction_items before deletion
CREATE TABLE IF NOT EXISTS deleted_transaction_items_backup (
    id INTEGER,
    transaction_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    backup_reason TEXT DEFAULT 'Related to deleted transactions'
);

INSERT INTO deleted_transaction_items_backup (id, transaction_id, product_id, quantity, price, created_at)
SELECT id, transaction_id, product_id, quantity, price, created_at
FROM transaction_items 
WHERE transaction_id IN (18973, 18466);

-- 4. VERIFICATION: Check what we're about to delete
-- This should show exactly 2 transactions
SELECT 
    'TRANSACTIONS TO DELETE' as type,
    COUNT(*) as count,
    MIN(created_at) as oldest_date,
    MAX(created_at) as newest_date
FROM transactions 
WHERE id IN (18973, 18466)

UNION ALL

SELECT 
    'TRANSACTION_ITEMS TO DELETE' as type,
    COUNT(*) as count,
    MIN(created_at) as oldest_date,
    MAX(created_at) as newest_date
FROM transaction_items 
WHERE transaction_id IN (18973, 18466);

-- 5. DELETION: Delete transaction_items first (child records)
DELETE FROM transaction_items 
WHERE transaction_id IN (18973, 18466);

-- 6. DELETION: Delete transactions (parent records)
DELETE FROM transactions 
WHERE id IN (18973, 18466);

-- 7. VERIFICATION: Confirm deletion
SELECT 
    'POST-DELETION VERIFICATION' as status,
    (SELECT COUNT(*) FROM transactions) as remaining_transactions,
    (SELECT COUNT(*) FROM deleted_transactions_backup) as backed_up_transactions,
    (SELECT COUNT(*) FROM deleted_transaction_items_backup) as backed_up_items;

-- 8. Final count check - should now be 18,000 transactions
SELECT 
    'FINAL COUNT CHECK' as check_type,
    COUNT(*) as transaction_count,
    CASE 
        WHEN COUNT(*) = 18000 THEN '✅ SUCCESS: Exactly 18,000 transactions remain'
        ELSE '⚠️ UNEXPECTED: Expected 18,000 transactions'
    END as result
FROM transactions;

-- Success message
SELECT json_build_object(
    'status', 'completed',
    'message', 'Successfully deleted 2 most recent transaction records',
    'deleted_transactions', ARRAY[18973, 18466],
    'backup_tables', ARRAY['deleted_transactions_backup', 'deleted_transaction_items_backup'],
    'recovery_note', 'Records can be restored from backup tables if needed',
    'timestamp', NOW()
) as deletion_result;