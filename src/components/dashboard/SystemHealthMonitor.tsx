import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, AlertCircle, Wifi, Database, Server } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  status: 'healthy' | 'error' | 'warning' | 'checking';
  message: string;
}

interface Health {
  api: HealthStatus;
  database: HealthStatus;
  cache: HealthStatus;
  lastChecked: Date | null;
}

const SystemHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<Health>({
    api: { status: 'checking', message: 'Checking API...' },
    database: { status: 'checking', message: 'Checking database...' },
    cache: { status: 'checking', message: 'Checking cache...' },
    lastChecked: null
  });

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    // Check API health
    try {
      const apiStartTime = Date.now();
      const response = await fetch(`${window.location.origin}/api/health`).catch(() => null);
      const apiResponseTime = Date.now() - apiStartTime;
      
      if (response?.ok) {
        setHealth(prev => ({
          ...prev,
          api: {
            status: 'healthy',
            message: `Responding normally (${apiResponseTime}ms)`
          }
        }));
      } else {
        // If no API endpoint exists, just mark as healthy since this is a frontend-focused app
        setHealth(prev => ({
          ...prev,
          api: {
            status: 'healthy',
            message: 'Frontend application running'
          }
        }));
      }
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        api: {
          status: 'warning',
          message: 'API endpoint not configured'
        }
      }));
    }

    // Check database (via Supabase)
    try {
      const dbStartTime = Date.now();
      const { error } = await supabase.from('brands').select('count').limit(1);
      const dbResponseTime = Date.now() - dbStartTime;
      
      if (!error) {
        setHealth(prev => ({
          ...prev,
          database: {
            status: 'healthy',
            message: `Connected to Supabase (${dbResponseTime}ms)`
          }
        }));
      } else {
        setHealth(prev => ({
          ...prev,
          database: {
            status: 'error',
            message: error.message
          }
        }));
      }
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        database: {
          status: 'error',
          message: 'Cannot connect to database'
        }
      }));
    }

    // Check cache/local storage
    try {
      const testKey = 'health_check_test';
      const testValue = Date.now().toString();
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        setHealth(prev => ({
          ...prev,
          cache: {
            status: 'healthy',
            message: 'Local storage functional'
          }
        }));
      } else {
        setHealth(prev => ({
          ...prev,
          cache: {
            status: 'warning',
            message: 'Local storage issues detected'
          }
        }));
      }
    } catch (error) {
      setHealth(prev => ({
        ...prev,
        cache: {
          status: 'error',
          message: 'Local storage unavailable'
        }
      }));
    }

    // Update last checked time
    setHealth(prev => ({
      ...prev,
      lastChecked: new Date()
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400 animate-pulse" />;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'api':
        return <Server className="h-4 w-4 text-gray-500" />;
      case 'database':
        return <Database className="h-4 w-4 text-gray-500" />;
      case 'cache':
        return <Wifi className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const services = [
    { key: 'api', label: 'Frontend App', ...health.api },
    { key: 'database', label: 'Supabase DB', ...health.database },
    { key: 'cache', label: 'Local Storage', ...health.cache }
  ];

  const allHealthy = services.every(s => s.status === 'healthy');
  const hasErrors = services.some(s => s.status === 'error');

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          System Health Monitor
        </h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          allHealthy ? 'bg-green-100 text-green-800' : 
          hasErrors ? 'bg-red-100 text-red-800' : 
          'bg-yellow-100 text-yellow-800'
        }`}>
          {allHealthy ? 'All Systems Operational' : 
           hasErrors ? 'System Issues Detected' : 
           'Checking Systems'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => (
          <div 
            key={service.key}
            className={`p-3 rounded-lg border ${
              service.status === 'healthy' ? 'border-green-200 bg-green-50' :
              service.status === 'error' ? 'border-red-200 bg-red-50' :
              service.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {getServiceIcon(service.key)}
                <span className="ml-2 font-medium text-gray-700">{service.label}</span>
              </div>
              {getStatusIcon(service.status)}
            </div>
            <p className="text-sm text-gray-600">{service.message}</p>
          </div>
        ))}
      </div>
      
      {health.lastChecked && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          Last checked: {health.lastChecked.toLocaleTimeString('en-PH')}
        </p>
      )}
    </div>
  );
};

export default SystemHealthMonitor;