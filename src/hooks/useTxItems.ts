import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const BATCH_SIZE = 500;

export async function fetchTransactionItems(ids: string[]) {
  try {
    let allItems = [];
    
    // Split IDs into batches of 500
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('transaction_items')
        .select('quantity, price, transaction_id, product_id, brand_id')
        .in('transaction_id', batchIds);

      if (error) {
        logger.error('Error fetching transaction items batch:', error);
        continue;
      }

      allItems = allItems.concat(data || []);
    }

    return allItems;
  } catch (error) {
    logger.error('Error in fetchTransactionItems:', error);
    return [];
  }
} 