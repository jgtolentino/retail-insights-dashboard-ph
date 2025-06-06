/**
 * Vercel API Endpoint for IoT Device Heartbeat
 * 
 * Handles device health monitoring and status updates
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface HeartbeatData {
  device_id: string;
  timestamp: string;
  status: 'online' | 'maintenance' | 'error';
  health_metrics: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    temperature: number;
    network_latency_ms: number;
    audio_input_level: number;
    uptime_seconds: number;
    error_count_24h: number;
  };
  firmware_version?: string;
  last_transaction_time?: string;
  pending_uploads_count?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const apiKey = authHeader.split(' ')[1];
    const validApiKeys = [
      process.env.IOT_DEVICE_API_KEY,
      process.env.IOT_DEVICE_BACKUP_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const heartbeatData: HeartbeatData = req.body;

    if (!heartbeatData.device_id || !heartbeatData.health_metrics) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        message: 'device_id and health_metrics are required'
      });
    }

    // Validate device exists
    const { data: device, error: deviceError } = await supabase
      .from('device_master')
      .select('device_id, status')
      .eq('device_id', heartbeatData.device_id)
      .single();

    if (deviceError || !device) {
      return res.status(404).json({
        error: 'Device not found',
        message: `Device ${heartbeatData.device_id} is not registered`
      });
    }

    // Update device heartbeat
    await supabase
      .from('device_master')
      .update({
        last_heartbeat: heartbeatData.timestamp || new Date().toISOString(),
        status: heartbeatData.status,
        firmware_version: heartbeatData.firmware_version,
        updated_at: new Date().toISOString()
      })
      .eq('device_id', heartbeatData.device_id);

    // Insert health metrics
    await supabase
      .from('device_health_metrics')
      .insert({
        device_id: heartbeatData.device_id,
        timestamp: heartbeatData.timestamp || new Date().toISOString(),
        ...heartbeatData.health_metrics
      });

    // Check for health-based alerts
    await checkHealthAlerts(heartbeatData.device_id, heartbeatData.health_metrics);

    console.log(`💓 Heartbeat received from ${heartbeatData.device_id}: ${heartbeatData.status}`);

    res.status(200).json({
      success: true,
      message: 'Heartbeat processed successfully',
      device_id: heartbeatData.device_id,
      status: heartbeatData.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Heartbeat handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process heartbeat'
    });
  }
}

async function checkHealthAlerts(deviceId: string, metrics: any) {
  const alerts = [];

  // Critical thresholds
  if (metrics.cpu_usage > 95) {
    alerts.push({
      alert_type: 'cpu_high',
      severity: 'critical',
      message: `Critical CPU usage: ${metrics.cpu_usage}%`
    });
  }

  if (metrics.memory_usage > 95) {
    alerts.push({
      alert_type: 'memory_high',
      severity: 'critical',
      message: `Critical memory usage: ${metrics.memory_usage}%`
    });
  }

  if (metrics.temperature > 80) {
    alerts.push({
      alert_type: 'temperature',
      severity: 'critical',
      message: `Critical temperature: ${metrics.temperature}°C`
    });
  }

  if (metrics.disk_usage > 90) {
    alerts.push({
      alert_type: 'disk_full',
      severity: 'critical',
      message: `Critical disk usage: ${metrics.disk_usage}%`
    });
  }

  // Create alerts
  for (const alert of alerts) {
    // Check if similar alert already exists
    const { data: existing } = await supabase
      .from('device_alerts')
      .select('alert_id')
      .eq('device_id', deviceId)
      .eq('alert_type', alert.alert_type)
      .eq('status', 'active')
      .single();

    if (!existing) {
      await supabase
        .from('device_alerts')
        .insert({
          device_id: deviceId,
          ...alert,
          status: 'active'
        });
    }
  }
}