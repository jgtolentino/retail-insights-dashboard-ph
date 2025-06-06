/**
 * Real-time Device Health Monitoring Dashboard
 *
 * Provides live monitoring of IoT devices using Supabase real-time
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wifi,
  WifiOff,
  Thermometer,
  Cpu,
  HardDrive,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  Circle,
  Activity,
  Store,
  RefreshCw,
  Bell,
  BellOff,
} from 'lucide-react';
import { iotEventsHub, IoTDevice, DeviceHealthEvent, DeviceAlert } from '@/services/iot-events-hub';

export function DeviceHealthDashboard() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<Map<string, DeviceHealthEvent>>(new Map());
  const [alerts, setAlerts] = useState<DeviceAlert[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Initialize IoT Events Hub
  useEffect(() => {
    const initializeHub = async () => {
      try {
        await iotEventsHub.initialize();
        setIsConnected(true);

        // Load initial data
        const currentDevices = await iotEventsHub.getDeviceStatus();
        setDevices(currentDevices);

        const currentAlerts = await iotEventsHub.getActiveAlerts();
        setAlerts(currentAlerts);
      } catch (error) {
        console.error('Failed to initialize IoT Events Hub:', error);
        setIsConnected(false);
      }
    };

    initializeHub();

    // Cleanup on unmount
    return () => {
      iotEventsHub.cleanup();
    };
  }, []);

  // Set up real-time event callbacks
  useEffect(() => {
    const callbacks = {
      onDeviceStatusChange: (device: IoTDevice) => {
        setDevices(prev => {
          const updated = prev.filter(d => d.device_id !== device.device_id);
          return [...updated, device];
        });
      },

      onHealthUpdate: (health: DeviceHealthEvent) => {
        setHealthMetrics(prev => {
          const updated = new Map(prev);
          updated.set(health.device_id, health);
          return updated;
        });
      },

      onAlert: (alert: DeviceAlert) => {
        setAlerts(prev => {
          // Add new alert or update existing
          const filtered = prev.filter(a => a.alert_id !== alert.alert_id);
          return [alert, ...filtered];
        });

        // Show browser notification for critical alerts
        if (alert.severity === 'critical' && notificationsEnabled && 'Notification' in window) {
          new Notification(`Critical Alert: ${alert.device_id}`, {
            body: alert.message,
            icon: '/device-alert-icon.png',
          });
        }
      },

      onDeviceOnline: (device: IoTDevice) => {
        console.log(`✅ Device ${device.device_id} came online`);
      },

      onDeviceOffline: (device: IoTDevice) => {
        console.log(`❌ Device ${device.device_id} went offline`);
      },

      onError: (error: Error) => {
        console.error('IoT Events Hub error:', error);
        setIsConnected(false);
      },
    };

    // Apply callbacks to hub
    Object.assign(iotEventsHub['callbacks'], callbacks);
  }, [notificationsEnabled]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return { status: 'critical', color: 'text-red-600' };
    if (value >= thresholds.warning) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'good', color: 'text-green-600' };
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const refreshData = async () => {
    try {
      const currentDevices = await iotEventsHub.getDeviceStatus();
      setDevices(currentDevices);

      const currentAlerts = await iotEventsHub.getActiveAlerts();
      setAlerts(currentAlerts);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    // This would typically call an API to acknowledge the alert
    setAlerts(prev => prev.filter(alert => alert.alert_id !== alertId));
  };

  const onlineDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Device Health Monitoring</h2>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? (
              <Bell className="mr-2 h-4 w-4" />
            ) : (
              <BellOff className="mr-2 h-4 w-4" />
            )}
            Notifications
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">
              {onlineDevices.length} online, {offlineDevices.length} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineDevices.length}</div>
            <p className="text-xs text-muted-foreground">
              {((onlineDevices.length / devices.length) * 100).toFixed(1)}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">{criticalAlerts.length} critical</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devices.length > 0 ? Math.round((onlineDevices.length / devices.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall system health</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {criticalAlerts.length} critical alert(s) require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Device Overview</TabsTrigger>
          <TabsTrigger value="health">Health Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Issues</TabsTrigger>
        </TabsList>

        {/* Device Overview Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map(device => (
              <Card
                key={device.device_id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDevice === device.device_id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDevice(device.device_id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="truncate text-sm font-medium">
                      {device.device_id}
                    </CardTitle>
                    {getStatusIcon(device.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
                    <span className="text-xs text-gray-500">{device.firmware_version}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Store className="h-3 w-3 text-gray-400" />
                      <span className="truncate text-xs text-gray-600">
                        {device.location.store_name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {device.location.city}, {device.location.region}
                    </div>
                    <div className="text-xs text-gray-400">
                      Last seen:{' '}
                      {device.last_heartbeat
                        ? new Date(device.last_heartbeat).toLocaleString()
                        : 'Never'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {devices.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">No devices registered yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Health Metrics Tab */}
        <TabsContent value="health" className="space-y-4">
          {selectedDevice && healthMetrics.has(selectedDevice) ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Health Metrics for {selectedDevice}</h3>

              {(() => {
                const health = healthMetrics.get(selectedDevice)!;
                return (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* CPU Usage */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${getHealthStatus(health.cpu_usage, { warning: 80, critical: 95 }).color}`}
                        >
                          {health.cpu_usage.toFixed(1)}%
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${
                              health.cpu_usage >= 95
                                ? 'bg-red-500'
                                : health.cpu_usage >= 80
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(health.cpu_usage, 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Memory Usage */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                        <MemoryStick className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${getHealthStatus(health.memory_usage, { warning: 85, critical: 95 }).color}`}
                        >
                          {health.memory_usage.toFixed(1)}%
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${
                              health.memory_usage >= 95
                                ? 'bg-red-500'
                                : health.memory_usage >= 85
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(health.memory_usage, 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Disk Usage */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${getHealthStatus(health.disk_usage, { warning: 80, critical: 90 }).color}`}
                        >
                          {health.disk_usage.toFixed(1)}%
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-2 rounded-full ${
                              health.disk_usage >= 90
                                ? 'bg-red-500'
                                : health.disk_usage >= 80
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(health.disk_usage, 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Temperature */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${getHealthStatus(health.temperature, { warning: 70, critical: 80 }).color}`}
                        >
                          {health.temperature.toFixed(1)}°C
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Normal: &lt;70°C</p>
                      </CardContent>
                    </Card>

                    {/* Network Latency */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Network Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold">{health.network_latency_ms}ms</div>
                            <p className="text-xs text-muted-foreground">Latency</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {Math.floor(health.uptime_seconds / 3600)}h
                            </div>
                            <p className="text-xs text-muted-foreground">Uptime</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Error Count */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Error Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`text-lg font-bold ${health.error_count_24h > 0 ? 'text-red-600' : 'text-green-600'}`}
                            >
                              {health.error_count_24h}
                            </div>
                            <p className="text-xs text-muted-foreground">Errors (24h)</p>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {health.audio_input_level.toFixed(1)}dB
                            </div>
                            <p className="text-xs text-muted-foreground">Audio Level</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">
                  {selectedDevice
                    ? 'No health metrics available for selected device.'
                    : 'Select a device to view health metrics.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.alert_id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{alert.device_id}</CardTitle>
                      <CardDescription className="capitalize">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getAlertSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dismissAlert(alert.alert_id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-gray-700">{alert.message}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                    <Badge variant="outline">{alert.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {alerts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
                <p className="text-gray-500">No active alerts. All systems are running normally.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
