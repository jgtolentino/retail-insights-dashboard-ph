import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

interface UseRealtimeOptions {
  enabled?: boolean;
  onUpdate?: () => void;
}

export function useRealtimeTransactions({ enabled = true, onUpdate }: UseRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to new transactions
        channel = supabase
          .channel('realtime-transactions')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transactions',
            },
            (payload) => {
              logger.info('New transaction received:', payload);
              setLastUpdate(new Date());
              
              // Invalidate relevant queries
              queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
              queryClient.invalidateQueries({ queryKey: ['time-series-data'] });
              
              if (onUpdate) {
                onUpdate();
              }
            }
          )
          .on('presence', { event: 'sync' }, () => {
            setIsConnected(true);
          })
          .subscribe((status) => {
            logger.info('Realtime subscription status:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

      } catch (error) {
        logger.error('Failed to setup realtime subscription:', error);
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setIsConnected(false);
    };
  }, [enabled, queryClient, onUpdate]);

  return { isConnected, lastUpdate };
}

export function useRealtimeProductUpdates({ enabled = true, onUpdate }: UseRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to product updates
        channel = supabase
          .channel('realtime-products')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'products',
            },
            (payload) => {
              logger.info('Product update received:', payload);
              setLastUpdate(new Date());
              
              // Invalidate product-related queries
              queryClient.invalidateQueries({ queryKey: ['products'] });
              queryClient.invalidateQueries({ queryKey: ['categories'] });
              
              if (onUpdate) {
                onUpdate();
              }
            }
          )
          .subscribe((status) => {
            logger.info('Product realtime subscription status:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

      } catch (error) {
        logger.error('Failed to setup product realtime subscription:', error);
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      setIsConnected(false);
    };
  }, [enabled, queryClient, onUpdate]);

  return { isConnected, lastUpdate };
}

// Combined hook for all realtime data
export function useRealtimeUpdates({ enabled = true }: { enabled?: boolean } = {}) {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  
  const { isConnected: transactionsConnected, lastUpdate: transactionsUpdate } = useRealtimeTransactions({
    enabled,
    onUpdate: () => setShowUpdateNotification(true),
  });
  
  const { isConnected: productsConnected, lastUpdate: productsUpdate } = useRealtimeProductUpdates({
    enabled,
    onUpdate: () => setShowUpdateNotification(true),
  });

  const isConnected = transactionsConnected || productsConnected;
  const lastUpdate = transactionsUpdate || productsUpdate;

  const dismissNotification = useCallback(() => {
    setShowUpdateNotification(false);
  }, []);

  return {
    isConnected,
    lastUpdate,
    showUpdateNotification,
    dismissNotification,
  };
}