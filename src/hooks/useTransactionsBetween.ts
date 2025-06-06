import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

const isoStart = (date: Date): string => {
  return date.toISOString().split('T')[0] + 'T00:00:00Z';
};

const isoEnd = (date: Date): string => {
  return date.toISOString().split('T')[0] + 'T23:59:59Z';
};

export async function useTransactionsBetween(start: Date, end: Date) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', isoStart(start))
      .lt('created_at', isoEnd(end));

    if (error) {
      logger.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Error in useTransactionsBetween:', error);
    return [];
  }
} 