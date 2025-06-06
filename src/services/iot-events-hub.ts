/**
 * IoT Events Hub using Supabase Real-time
 *
 * Provides real-time IoT device monitoring and event processing
 * Uses Supabase's built-in real-time capabilities instead of Azure IoT Hub
 * Faithful to our Supabase + Vercel architecture
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface IoTDevice {
  device_id: string;
  store_id: number;
  mac_address: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  last_heartbeat: string;
  firmware_version: string;
  location: {
    store_name: string;
    city: string;
    region: string;
  };
}

export interface DeviceHealthEvent {
  device_id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature: number;
  network_latency_ms: number;
  audio_input_level: number;
  uptime_seconds: number;
  error_count_24h: number;
}

export interface DeviceAlert {
  alert_id: string;
  device_id: string;
  alert_type:
    | 'temperature'
    | 'disk_full'
    | 'network_down'
    | 'upload_failed'
    | 'cpu_high'
    | 'memory_high';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface TransactionEvent {
  interaction_id: string;
  device_id: string;
  store_id: number;
  timestamp: string;
  customer_data: {
    facial_id: string;
    gender: string;
    age: number;
    emotion: string;
  };
  transaction_data: {
    items: Array<{
      brand_name: string;
      product_name: string;
      quantity: number;
      confidence: number;
    }>;
    total_amount?: number;
    transcript: string;
  };
}

export interface IoTEventCallbacks {
  onDeviceStatusChange?: (device: IoTDevice) => void;
  onHealthUpdate?: (health: DeviceHealthEvent) => void;
  onAlert?: (alert: DeviceAlert) => void;
  onTransaction?: (transaction: TransactionEvent) => void;
  onDeviceOnline?: (device: IoTDevice) => void;
  onDeviceOffline?: (device: IoTDevice) => void;
  onError?: (error: Error) => void;
}

export class IoTEventsHub {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: IoTEventCallbacks = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(callbacks: IoTEventCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Initialize IoT Events Hub with real-time subscriptions
   */
  async initialize(): Promise<void> {
    try {
      // Subscribe to device status changes
      await this.subscribeToDeviceStatus();

      // Subscribe to health metrics
      await this.subscribeToHealthMetrics();

      // Subscribe to alerts
      await this.subscribeToAlerts();

      // Subscribe to transactions
      await this.subscribeToTransactions();

      this.isConnected = true;
      this.reconnectAttempts = 0;

      } catch (error) {
      this.callbacks.onError?.(error as Error);
      await this.handleReconnection();
    }
  }

  /**
   * Subscribe to device status changes
   */
  private async subscribeToDeviceStatus(): Promise<void> {
    const channel = supabase
      .channel('device-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_master',
        },
        payload => {
          this.handleDeviceStatusChange(payload);
        }
      )
      .subscribe();

    this.channels.set('device-status', channel);
  }

  /**
   * Subscribe to health metrics updates
   */
  private async subscribeToHealthMetrics(): Promise<void> {
    const channel = supabase
      .channel('device-health-metrics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_health_metrics',
        },
        payload => {
          this.handleHealthUpdate(payload);
        }
      )
      .subscribe();

    this.channels.set('health-metrics', channel);
  }

  /**
   * Subscribe to device alerts
   */
  private async subscribeToAlerts(): Promise<void> {
    const channel = supabase
      .channel('device-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_alerts',
        },
        payload => {
          this.handleAlert(payload);
        }
      )
      .subscribe();

    this.channels.set('alerts', channel);
  }

  /**
   * Subscribe to transaction events
   */
  private async subscribeToTransactions(): Promise<void> {
    const channel = supabase
      .channel('transaction-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_interactions',
        },
        payload => {
          this.handleTransaction(payload);
        }
      )
      .subscribe();

    this.channels.set('transactions', channel);
  }

  /**
   * Handle device status change events
   */
  private handleDeviceStatusChange(payload: any): void {
    try {
      const device: IoTDevice = {
        device_id: payload.new.device_id,
        store_id: payload.new.store_id,
        mac_address: payload.new.mac_address,
        status: payload.new.status,
        last_heartbeat: payload.new.last_heartbeat,
        firmware_version: payload.new.firmware_version,
        location: {
          store_name: '', // Will be enriched separately
          city: '',
          region: '',
        },
      };

      // Enrich with store data
      this.enrichDeviceWithStoreData(device);

      this.callbacks.onDeviceStatusChange?.(device);

      // Trigger specific status callbacks
      if (payload.new.status === 'online' && payload.old?.status !== 'online') {
        this.callbacks.onDeviceOnline?.(device);
      } else if (payload.new.status === 'offline' && payload.old?.status !== 'offline') {
        this.callbacks.onDeviceOffline?.(device);
      }

      } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle health metric updates
   */
  private handleHealthUpdate(payload: any): void {
    try {
      const health: DeviceHealthEvent = {
        device_id: payload.new.device_id,
        timestamp: payload.new.timestamp,
        cpu_usage: payload.new.cpu_usage,
        memory_usage: payload.new.memory_usage,
        disk_usage: payload.new.disk_usage,
        temperature: payload.new.temperature,
        network_latency_ms: payload.new.network_latency_ms,
        audio_input_level: payload.new.audio_input_level,
        uptime_seconds: payload.new.uptime_seconds,
        error_count_24h: payload.new.error_count_24h,
      };

      this.callbacks.onHealthUpdate?.(health);

      // Check for health-based alerts
      this.checkHealthThresholds(health);

      } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle alert events
   */
  private handleAlert(payload: any): void {
    try {
      const alert: DeviceAlert = {
        alert_id: payload.new.alert_id,
        device_id: payload.new.device_id,
        alert_type: payload.new.alert_type,
        severity: payload.new.severity,
        message: payload.new.message,
        status: payload.new.status,
        created_at: payload.new.created_at,
      };

      this.callbacks.onAlert?.(alert);

      // Log critical alerts
      if (alert.severity === 'critical') {
        } else {
        `);
      }
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Handle transaction events
   */
  private handleTransaction(payload: any): void {
    try {
      const transaction: TransactionEvent = {
        interaction_id: payload.new.interaction_id,
        device_id: payload.new.device_id,
        store_id: payload.new.store_id,
        timestamp: payload.new.transaction_date,
        customer_data: {
          facial_id: payload.new.facial_id,
          gender: payload.new.gender,
          age: payload.new.age,
          emotion: payload.new.emotional_state,
        },
        transaction_data: {
          items: [], // Will be enriched from transaction_items
          transcript: payload.new.transcription_text,
        },
      };

      // Enrich transaction with items data
      this.enrichTransactionWithItems(transaction);

      this.callbacks.onTransaction?.(transaction);

      } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Enrich device data with store information
   */
  private async enrichDeviceWithStoreData(device: IoTDevice): Promise<void> {
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('name, city, region')
        .eq('id', device.store_id)
        .single();

      if (store) {
        device.location = {
          store_name: store.name,
          city: store.city,
          region: store.region,
        };
      }
    } catch (error) {
      }
  }

  /**
   * Enrich transaction with items data
   */
  private async enrichTransactionWithItems(transaction: TransactionEvent): Promise<void> {
    try {
      const { data: items } = await supabase
        .from('transaction_items_enhanced')
        .select('*')
        .eq('interaction_id', transaction.interaction_id);

      if (items) {
        transaction.transaction_data.items = items.map(item => ({
          brand_name: item.brand_name,
          product_name: item.product_name,
          quantity: item.quantity,
          confidence: item.confidence_score,
        }));
      }
    } catch (error) {
      }
  }

  /**
   * Check health thresholds and create alerts
   */
  private async checkHealthThresholds(health: DeviceHealthEvent): Promise<void> {
    const alerts: Array<{ type: string; message: string; severity: string }> = [];

    // CPU usage alerts
    if (health.cpu_usage > 95) {
      alerts.push({
        type: 'cpu_high',
        message: `Critical CPU usage: ${health.cpu_usage}%`,
        severity: 'critical',
      });
    } else if (health.cpu_usage > 80) {
      alerts.push({
        type: 'cpu_high',
        message: `High CPU usage: ${health.cpu_usage}%`,
        severity: 'high',
      });
    }

    // Memory usage alerts
    if (health.memory_usage > 95) {
      alerts.push({
        type: 'memory_high',
        message: `Critical memory usage: ${health.memory_usage}%`,
        severity: 'critical',
      });
    } else if (health.memory_usage > 85) {
      alerts.push({
        type: 'memory_high',
        message: `High memory usage: ${health.memory_usage}%`,
        severity: 'high',
      });
    }

    // Temperature alerts
    if (health.temperature > 80) {
      alerts.push({
        type: 'temperature',
        message: `Critical temperature: ${health.temperature}°C`,
        severity: 'critical',
      });
    } else if (health.temperature > 70) {
      alerts.push({
        type: 'temperature',
        message: `High temperature: ${health.temperature}°C`,
        severity: 'high',
      });
    }

    // Disk usage alerts
    if (health.disk_usage > 90) {
      alerts.push({
        type: 'disk_full',
        message: `Critical disk usage: ${health.disk_usage}%`,
        severity: 'critical',
      });
    } else if (health.disk_usage > 80) {
      alerts.push({
        type: 'disk_full',
        message: `High disk usage: ${health.disk_usage}%`,
        severity: 'high',
      });
    }

    // Network latency alerts
    if (health.network_latency_ms > 3000) {
      alerts.push({
        type: 'network_down',
        message: `High network latency: ${health.network_latency_ms}ms`,
        severity: 'high',
      });
    }

    // Create alerts in database
    for (const alert of alerts) {
      await this.createAlert(health.device_id, alert.type, alert.message, alert.severity);
    }
  }

  /**
   * Create an alert in the database
   */
  private async createAlert(
    deviceId: string,
    type: string,
    message: string,
    severity: string
  ): Promise<void> {
    try {
      // Check if similar alert already exists and is active
      const { data: existingAlert } = await supabase
        .from('device_alerts')
        .select('alert_id')
        .eq('device_id', deviceId)
        .eq('alert_type', type)
        .eq('status', 'active')
        .single();

      if (!existingAlert) {
        await supabase.from('device_alerts').insert({
          device_id: deviceId,
          alert_type: type,
          severity,
          message,
          status: 'active',
        });
      }
    } catch (error) {
      }
  }

  /**
   * Get current device status
   */
  async getDeviceStatus(deviceId?: string): Promise<IoTDevice[]> {
    try {
      let query = supabase.from('device_master').select(`
          device_id,
          store_id,
          mac_address,
          status,
          last_heartbeat,
          firmware_version,
          stores (
            name,
            city,
            region
          )
        `);

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(device => ({
        device_id: device.device_id,
        store_id: device.store_id,
        mac_address: device.mac_address,
        status: device.status,
        last_heartbeat: device.last_heartbeat,
        firmware_version: device.firmware_version,
        location: {
          store_name: device.stores?.name || '',
          city: device.stores?.city || '',
          region: device.stores?.region || '',
        },
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(deviceId?: string): Promise<DeviceAlert[]> {
    try {
      let query = supabase
        .from('device_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Send command to device (via database trigger or webhook)
   */
  async sendDeviceCommand(
    deviceId: string,
    command: {
      type: 'restart' | 'update_firmware' | 'adjust_settings' | 'run_diagnostics';
      parameters?: any;
    }
  ): Promise<boolean> {
    try {
      // Store command in database for device to pick up
      const { error } = await supabase.from('device_commands').insert({
        device_id: deviceId,
        command_type: command.type,
        parameters: command.parameters,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle reconnection logic
   */
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    `
    );

    setTimeout(async () => {
      await this.cleanup();
      await this.initialize();
    }, delay);
  }

  /**
   * Cleanup connections
   */
  async cleanup(): Promise<void> {
    for (const [name, channel] of this.channels) {
      await supabase.removeChannel(channel);
      }

    this.channels.clear();
    this.isConnected = false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    activeChannels: number;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      activeChannels: this.channels.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Export singleton instance
export const iotEventsHub = new IoTEventsHub();

// Utility functions for IoT data processing
export class IoTDataProcessor {
  /**
   * Process device batch data from edge devices
   */
  static async processBatchUpload(batchData: {
    device_id: string;
    store_id: number;
    batch_metadata: any;
    transactions: any[];
    health_metrics?: any;
  }): Promise<boolean> {
    try {
      // Process transactions
      for (const transaction of batchData.transactions) {
        await supabase.from('sales_interactions').insert({
          interaction_id: transaction.interaction_id,
          device_id: batchData.device_id,
          store_id: batchData.store_id,
          transaction_date: transaction.timestamp,
          facial_id: transaction.customer.facial_id,
          gender: transaction.customer.gender,
          age: transaction.customer.age,
          emotional_state: transaction.customer.emotion,
          transcription_text: transaction.transcript,
        });

        // Process transaction items
        for (const item of transaction.items) {
          await supabase.from('transaction_items_enhanced').insert({
            interaction_id: transaction.interaction_id,
            brand_name: item.brand_name,
            product_name: item.product_name,
            quantity: item.quantity,
            confidence_score: item.confidence,
          });
        }
      }

      // Process health metrics if provided
      if (batchData.health_metrics) {
        await supabase.from('device_health_metrics').insert({
          device_id: batchData.device_id,
          ...batchData.health_metrics,
        });
      }

      // Update device last upload time
      await supabase
        .from('device_master')
        .update({
          last_upload: new Date().toISOString(),
          total_transactions_recorded: supabase.rpc('increment_transaction_count', {
            device_id: batchData.device_id,
            count: batchData.transactions.length,
          }),
        })
        .eq('device_id', batchData.device_id);

      return true;
    } catch (error) {
      return false;
    }
  }
}
