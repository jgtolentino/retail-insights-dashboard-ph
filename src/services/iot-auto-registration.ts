/**
 * IoT Auto-Registration System
 *
 * Addresses critical device collision issues identified in Project Scout analysis.
 * Prevents multiple devices from using the same device ID.
 *
 * Key Features:
 * - Unique device ID generation using MAC address + timestamp
 * - Automatic device registration with store association
 * - Device metadata tracking and validation
 * - Collision detection and prevention
 */

import { supabase } from '@/integrations/supabase/client';

export interface DeviceRegistrationData {
  macAddress: string;
  storeId: number;
  installerName: string;
  firmwareVersion: string;
  hardwareRevision: string;
  networkConfig: {
    networkType: 'wifi' | 'cellular' | 'hybrid';
    ssid?: string;
    signalStrength?: number;
    ipAddress?: string;
  };
}

export interface DeviceMetadata {
  deviceType: string;
  location: string;
  firmwareVersion: string;
  macAddress: string;
  storeId: number;
  installerName: string;
  registrationTimestamp: string;
}

export class IoTAutoRegistrationHub {
  private static instance: IoTAutoRegistrationHub;

  public static getInstance(): IoTAutoRegistrationHub {
    if (!IoTAutoRegistrationHub.instance) {
      IoTAutoRegistrationHub.instance = new IoTAutoRegistrationHub();
    }
    return IoTAutoRegistrationHub.instance;
  }

  /**
   * Auto-register a new device with unique ID generation
   */
  async autoRegisterDevice(registrationData: DeviceRegistrationData): Promise<string> {
    try {
      // Step 1: Validate MAC address format
      if (!this.isValidMacAddress(registrationData.macAddress)) {
        throw new Error('Invalid MAC address format');
      }

      // Step 2: Check for existing device with same MAC
      const existingDevice = await this.findDeviceByMac(registrationData.macAddress);
      if (existingDevice) {
        throw new Error(
          `Device with MAC ${registrationData.macAddress} already registered as ${existingDevice.device_id}`
        );
      }

      // Step 3: Generate unique device ID
      const uniqueDeviceId = this.generateUniqueDeviceId(
        registrationData.macAddress,
        registrationData.storeId
      );

      // Step 4: Validate store exists
      const store = await this.validateStore(registrationData.storeId);
      if (!store) {
        throw new Error(`Store ID ${registrationData.storeId} not found`);
      }

      // Step 5: Register device in master data table
      const deviceData = {
        device_id: uniqueDeviceId,
        mac_address: registrationData.macAddress,
        store_id: registrationData.storeId,
        installation_date: new Date().toISOString(),
        installer_name: registrationData.installerName,
        firmware_version: registrationData.firmwareVersion,
        hardware_revision: registrationData.hardwareRevision,
        network_config: registrationData.networkConfig,
        device_type: 'RaspberryPi5',
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('device_master')
        .insert(deviceData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Step 6: Create installation record
      await this.createInstallationRecord(uniqueDeviceId, registrationData);

      // Step 7: Initialize device health monitoring
      await this.initializeHealthMonitoring(uniqueDeviceId);

      return uniqueDeviceId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate unique device ID to prevent collisions
   */
  private generateUniqueDeviceId(macAddress: string, storeId: number): string {
    // Clean MAC address (remove colons, make uppercase)
    const cleanMac = macAddress.replace(/[:-]/g, '').toUpperCase();

    // Get last 6 characters of MAC for uniqueness
    const macSuffix = cleanMac.slice(-6);

    // Generate timestamp-based suffix
    const timestamp = Date.now().toString(36); // Base 36 for shorter string

    // Format: Pi5_Store{StoreID}_{MacSuffix}_{Timestamp}
    return `Pi5_Store${storeId.toString().padStart(3, '0')}_${macSuffix}_${timestamp}`;
  }

  /**
   * Validate MAC address format
   */
  private isValidMacAddress(macAddress: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(macAddress);
  }

  /**
   * Find existing device by MAC address
   */
  private async findDeviceByMac(macAddress: string) {
    const { data, error } = await supabase
      .from('device_master')
      .select('device_id, status')
      .eq('mac_address', macAddress)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw error;
    }

    return data;
  }

  /**
   * Validate store exists in database
   */
  private async validateStore(storeId: number) {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, city')
      .eq('id', storeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Create installation tracking record
   */
  private async createInstallationRecord(
    deviceId: string,
    registrationData: DeviceRegistrationData
  ) {
    const installationData = {
      device_id: deviceId,
      store_id: registrationData.storeId,
      installation_date: new Date().toISOString().split('T')[0], // Date only
      installer_name: registrationData.installerName,
      pre_installation_checklist: {
        network_test: 'pending',
        audio_test: 'pending',
        power_test: 'pending',
        mounting_check: 'pending',
      },
      network_test_results: registrationData.networkConfig,
      installation_status: 'scheduled',
    };

    const { error } = await supabase.from('device_installations').insert(installationData);

    if (error) {
      // Don't throw - installation record is secondary
    }
  }

  /**
   * Initialize health monitoring for new device
   */
  private async initializeHealthMonitoring(deviceId: string) {
    const initialHealthData = {
      device_id: deviceId,
      cpu_usage: 0,
      memory_usage: 0,
      disk_usage: 0,
      temperature: 0,
      network_latency_ms: 0,
      audio_input_level: 0,
      last_upload_success: false,
      error_count_24h: 0,
      uptime_seconds: 0,
    };

    const { error } = await supabase.from('device_health_metrics').insert(initialHealthData);

    if (error) {
      // Don't throw - health monitoring can be set up later
    }
  }

  /**
   * Get device configuration for edge deployment
   */
  async getDeviceConfiguration(deviceId: string) {
    const { data, error } = await supabase
      .from('device_master')
      .select(
        `
        device_id,
        store_id,
        firmware_version,
        network_config,
        status,
        stores (
          name,
          city,
          region
        )
      `
      )
      .eq('device_id', deviceId)
      .single();

    if (error) {
      throw new Error(`Device ${deviceId} not found: ${error.message}`);
    }

    return data;
  }

  /**
   * Update device status (e.g., pending -> active -> maintenance)
   */
  async updateDeviceStatus(
    deviceId: string,
    status: 'pending' | 'active' | 'maintenance' | 'retired'
  ) {
    const { error } = await supabase
      .from('device_master')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('device_id', deviceId);

    if (error) {
      throw error;
    }

    }

  /**
   * Detect and report device collisions
   */
  async detectDeviceCollisions(): Promise<
    Array<{ deviceId: string; storeCount: number; stores: string[] }>
  > {
    // This query identifies devices that appear to be used in multiple stores
    // Based on transaction patterns - critical for data integrity

    const { data, error } = await supabase.rpc('detect_device_collisions');

    if (error) {
      return [];
    }

    const collisions = data || [];

    if (collisions.length > 0) {
      collisions.forEach(collision => {
        }`
        );
      });
    }

    return collisions;
  }

  /**
   * Generate installation checklist for new device
   */
  generateInstallationChecklist(storeId: number): object {
    return {
      pre_installation: {
        network_survey: false,
        power_outlet_verified: false,
        mounting_location_identified: false,
        store_manager_briefed: false,
        device_unboxed_and_tested: false,
      },
      installation: {
        device_mounted_securely: false,
        power_connected: false,
        network_connected: false,
        audio_input_tested: false,
        initial_sync_completed: false,
      },
      post_installation: {
        test_transaction_recorded: false,
        store_manager_trained: false,
        monitoring_alerts_configured: false,
        documentation_completed: false,
        photos_uploaded: false,
      },
      validation: {
        device_responds_to_ping: false,
        health_metrics_receiving: false,
        transaction_data_flowing: false,
        no_error_alerts: false,
        store_manager_satisfied: false,
      },
    };
  }
}

// Export singleton instance
export const iotAutoRegistration = IoTAutoRegistrationHub.getInstance();

// Helper functions for edge device deployment
export class EdgeDeviceDeployment {
  /**
   * Generate device configuration script for Raspberry Pi
   */
  static generateDeviceConfigScript(
    deviceId: string,
    registrationData: DeviceRegistrationData
  ): string {
    return `#!/bin/bash
# Project Scout Device Configuration Script
# Generated for Device: ${deviceId}
# Store: ${registrationData.storeId}
# Installation Date: ${new Date().toISOString().split('T')[0]}

echo "🔧 Configuring Project Scout Device..."
echo "Device ID: ${deviceId}"
echo "Store ID: ${registrationData.storeId}"

# Set device environment variables
echo "export DEVICE_ID='${deviceId}'" >> ~/.bashrc
echo "export STORE_ID='${registrationData.storeId}'" >> ~/.bashrc
echo "export INSTALLER_NAME='${registrationData.installerName}'" >> ~/.bashrc
echo "export FIRMWARE_VERSION='${registrationData.firmwareVersion}'" >> ~/.bashrc

# Create device configuration file
cat > /home/pi/project-scout/device-config.json << EOF
{
  "device_id": "${deviceId}",
  "store_id": ${registrationData.storeId},
  "mac_address": "${registrationData.macAddress}",
  "firmware_version": "${registrationData.firmwareVersion}",
  "hardware_revision": "${registrationData.hardwareRevision}",
  "network_config": ${JSON.stringify(registrationData.networkConfig, null, 2)},
  "registration_date": "${new Date().toISOString()}",
  "installer": "${registrationData.installerName}"
}
EOF

# Update Python configuration
sed -i 's/Pi5_Device_001/${deviceId}/g' /home/pi/project-scout/STT_prod.py
sed -i 's/Pi5_Device_001/${deviceId}/g' /home/pi/project-scout/STT.py

# Restart services
sudo systemctl restart project-scout
sudo systemctl restart project-scout-health

echo "✅ Device configuration completed!"
echo "Device ID: ${deviceId} is ready for operation"
`;
  }

  /**
   * Generate health monitoring configuration
   */
  static generateHealthMonitoringConfig(deviceId: string): object {
    return {
      device_id: deviceId,
      monitoring_interval_seconds: 300, // 5 minutes
      alert_thresholds: {
        cpu_usage_warning: 80,
        cpu_usage_critical: 95,
        memory_usage_warning: 85,
        memory_usage_critical: 95,
        disk_usage_warning: 80,
        disk_usage_critical: 90,
        temperature_warning: 70,
        temperature_critical: 80,
        network_latency_warning: 1000,
        network_latency_critical: 3000,
      },
      upload_endpoint: `${process.env.VITE_APP_URL}/api/device-health`,
      heartbeat_interval_seconds: 60,
      retry_attempts: 3,
      retry_delay_seconds: 30,
    };
  }
}
