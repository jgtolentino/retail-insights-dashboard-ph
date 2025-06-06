/**
 * Vercel API Endpoint for IoT Device Data Upload
 * 
 * Handles edge device data uploads in our Supabase + Vercel architecture
 * Replaces Azure IoT Hub functionality with webhook-based ingestion
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { IoTDataProcessor } from '../../src/services/iot-events-hub';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for backend operations
);

interface DeviceBatchData {
  device_id: string;
  store_id: number;
  batch_metadata: {
    batch_id: string;
    created_at: string;
    transaction_count: number;
    firmware_version?: string;
  };
  transactions: Array<{
    interaction_id: string;
    timestamp: string;
    customer: {
      facial_id: string;
      gender: string;
      age: number;
      emotion: string;
    };
    transcript: string;
    items: Array<{
      brand_name: string;
      product_name: string;
      quantity: number;
      confidence: number;
    }>;
    session_matches?: Array<{
      transcript_id: string;
      detection_id: string;
      match_confidence: number;
      time_offset_ms: number;
    }>;
  }>;
  health_metrics?: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    temperature: number;
    network_latency_ms: number;
    audio_input_level: number;
    uptime_seconds: number;
    error_count_24h: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    console.log('📡 Received device upload request');

    // Validate authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid API key required'
      });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // Validate API key (you can store valid keys in Supabase or environment)
    const validApiKeys = [
      process.env.IOT_DEVICE_API_KEY,
      process.env.IOT_DEVICE_BACKUP_KEY
    ].filter(Boolean);

    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    // Validate request body
    const batchData: DeviceBatchData = req.body;
    
    if (!batchData.device_id || !batchData.store_id || !batchData.transactions) {
      return res.status(400).json({
        error: 'Invalid request body',
        message: 'device_id, store_id, and transactions are required'
      });
    }

    // Validate device exists and is authorized for this store
    const { data: device, error: deviceError } = await supabase
      .from('device_master')
      .select('device_id, store_id, status')
      .eq('device_id', batchData.device_id)
      .single();

    if (deviceError || !device) {
      console.error('❌ Device validation failed:', deviceError);
      return res.status(404).json({
        error: 'Device not found',
        message: `Device ${batchData.device_id} is not registered`
      });
    }

    if (device.store_id !== batchData.store_id) {
      console.error('❌ Store mismatch:', { 
        deviceStore: device.store_id, 
        requestStore: batchData.store_id 
      });
      return res.status(403).json({
        error: 'Store mismatch',
        message: `Device ${batchData.device_id} is not authorized for store ${batchData.store_id}`
      });
    }

    if (device.status !== 'active') {
      return res.status(403).json({
        error: 'Device not active',
        message: `Device ${batchData.device_id} is not in active status`
      });
    }

    // Process the batch data
    console.log(`📦 Processing batch from ${batchData.device_id}: ${batchData.transactions.length} transactions`);
    
    const success = await IoTDataProcessor.processBatchUpload(batchData);

    if (!success) {
      return res.status(500).json({
        error: 'Processing failed',
        message: 'Failed to process batch data'
      });
    }

    // Update device heartbeat
    await supabase
      .from('device_master')
      .update({
        last_heartbeat: new Date().toISOString(),
        status: 'active'
      })
      .eq('device_id', batchData.device_id);

    // Send health metrics if provided
    if (batchData.health_metrics) {
      await supabase
        .from('device_health_metrics')
        .insert({
          device_id: batchData.device_id,
          timestamp: new Date().toISOString(),
          ...batchData.health_metrics
        });
    }

    // Log successful upload
    console.log(`✅ Successfully processed upload from ${batchData.device_id}`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Batch data processed successfully',
      processed: {
        device_id: batchData.device_id,
        store_id: batchData.store_id,
        batch_id: batchData.batch_metadata.batch_id,
        transactions_count: batchData.transactions.length,
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Device upload handler error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing the upload',
      timestamp: new Date().toISOString()
    });
  }
}

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow larger uploads for batch data
    },
  },
}