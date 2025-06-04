#!/usr/bin/env python3
"""
Project Scout Edge Device Client
Connects edge devices to Project Scout Supabase backend
"""

import os
import json
import time
import logging
import requests
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import subprocess

# Third-party imports (install with pip)
try:
    from supabase import create_client, Client
    import psutil
except ImportError as e:
    print(f"Missing dependencies: {e}")
    print("Install with: pip install supabase psutil requests")
    exit(1)

class ProjectScoutEdgeClient:
    """Edge device client for Project Scout system"""
    
    def __init__(self, config_file: str = "edge_device_config.json"):
        """Initialize edge client with configuration"""
        
        # Load configuration
        with open(config_file, 'r') as f:
            self.config = json.load(f)
        
        # Setup logging
        log_level = self.config.get('logging', {}).get('level', 'INFO')
        logging.basicConfig(
            level=getattr(logging, log_level),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Initialize Supabase client
        self.supabase_url = self.config['endpoints']['supabase']['base_url']
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_key:
            raise ValueError("SUPABASE_ANON_KEY environment variable required")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Device identification
        self.device_id = self.generate_device_id()
        self.store_id = os.getenv('DEFAULT_STORE_ID', 'store_001')
        
        # Data cache for offline operation
        self.offline_cache = []
        self.last_sync = None
        
        self.logger.info(f"Edge client initialized for device: {self.device_id}")
    
    def generate_device_id(self) -> str:
        """Generate unique device ID based on hardware"""
        try:
            # Get MAC address and CPU serial
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                           for elements in range(0,8*6,8)][::-1])
            
            # Get CPU serial (Raspberry Pi specific)
            cpu_serial = "unknown"
            try:
                with open('/proc/cpuinfo', 'r') as f:
                    for line in f:
                        if line.startswith('Serial'):
                            cpu_serial = line.split(':')[1].strip()
                            break
            except:
                pass
            
            # Create device fingerprint
            fingerprint = f"{mac}-{cpu_serial}-RaspberryPi5"
            device_hash = hashlib.sha256(fingerprint.encode()).hexdigest()[:12]
            return f"Pi5_Edge_{device_hash}"
            
        except Exception as e:
            self.logger.warning(f"Could not generate hardware-based ID: {e}")
            return f"Pi5_Edge_{uuid.uuid4().hex[:12]}"
    
    def register_device(self) -> bool:
        """Register device with Project Scout backend"""
        try:
            device_info = {
                'device_id': self.device_id,
                'device_type': self.config['device_settings']['device_type'],
                'firmware_version': self.config['device_settings']['firmware_version'],
                'store_id': self.store_id,
                'registration_time': datetime.utcnow().isoformat(),
                'status': 'active',
                'last_seen': datetime.utcnow().isoformat()
            }
            
            # Check if device already exists
            existing = self.supabase.table('devices').select('*').eq('device_id', self.device_id).execute()
            
            if existing.data:
                # Update existing device
                result = self.supabase.table('devices').update({
                    'last_seen': datetime.utcnow().isoformat(),
                    'status': 'active'
                }).eq('device_id', self.device_id).execute()
                
                self.logger.info(f"Updated existing device registration: {self.device_id}")
            else:
                # Register new device
                result = self.supabase.table('devices').insert(device_info).execute()
                self.logger.info(f"Registered new device: {self.device_id}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Device registration failed: {e}")
            return False
    
    def send_transaction_data(self, transaction_data: Dict[str, Any]) -> bool:
        """Send transaction data to Project Scout backend"""
        try:
            # Add device metadata
            transaction_data.update({
                'device_id': self.device_id,
                'store_id': self.store_id,
                'created_at': datetime.utcnow().isoformat()
            })
            
            # Send to Supabase
            result = self.supabase.table('transactions').insert(transaction_data).execute()
            
            if result.data:
                self.logger.info(f"Transaction sent successfully: {result.data[0]['id']}")
                return True
            else:
                raise Exception("No data returned from insert")
                
        except Exception as e:
            self.logger.error(f"Failed to send transaction: {e}")
            
            # Cache for offline sync
            self.cache_offline_data('transaction', transaction_data)
            return False
    
    def send_product_detection(self, product_data: Dict[str, Any]) -> bool:
        """Send product detection data"""
        try:
            detection_data = {
                'device_id': self.device_id,
                'store_id': self.store_id,
                'detected_at': datetime.utcnow().isoformat(),
                **product_data
            }
            
            result = self.supabase.table('product_detections').insert(detection_data).execute()
            
            if result.data:
                self.logger.info(f"Product detection sent: {product_data.get('brand', 'unknown')}")
                return True
            else:
                raise Exception("No data returned from insert")
                
        except Exception as e:
            self.logger.error(f"Failed to send product detection: {e}")
            self.cache_offline_data('product_detection', detection_data)
            return False
    
    def send_health_metrics(self) -> bool:
        """Send device health metrics"""
        try:
            # Collect system metrics
            health_data = {
                'device_id': self.device_id,
                'timestamp': datetime.utcnow().isoformat(),
                'cpu_usage': psutil.cpu_percent(interval=1),
                'memory_usage': psutil.virtual_memory().percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'temperature': self.get_cpu_temperature(),
                'uptime_seconds': time.time() - psutil.boot_time(),
                'network_connected': self.check_network_connection()
            }
            
            result = self.supabase.table('device_health').insert(health_data).execute()
            
            if result.data:
                self.logger.debug("Health metrics sent successfully")
                return True
            else:
                raise Exception("No data returned from insert")
                
        except Exception as e:
            self.logger.error(f"Failed to send health metrics: {e}")
            return False
    
    def get_cpu_temperature(self) -> Optional[float]:
        """Get CPU temperature (Raspberry Pi specific)"""
        try:
            with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
                temp = float(f.read()) / 1000.0
                return round(temp, 2)
        except:
            return None
    
    def check_network_connection(self) -> bool:
        """Check if device has network connectivity"""
        try:
            response = requests.get(self.supabase_url, timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def cache_offline_data(self, data_type: str, data: Dict[str, Any]):
        """Cache data for offline sync"""
        cache_entry = {
            'type': data_type,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        self.offline_cache.append(cache_entry)
        
        # Limit cache size
        max_cache_size = 1000
        if len(self.offline_cache) > max_cache_size:
            self.offline_cache = self.offline_cache[-max_cache_size:]
        
        self.logger.debug(f"Cached {data_type} data for offline sync")
    
    def sync_offline_data(self) -> bool:
        """Sync cached offline data"""
        if not self.offline_cache:
            return True
        
        synced_count = 0
        failed_items = []
        
        for item in self.offline_cache:
            try:
                data_type = item['type']
                data = item['data']
                
                if data_type == 'transaction':
                    result = self.supabase.table('transactions').insert(data).execute()
                elif data_type == 'product_detection':
                    result = self.supabase.table('product_detections').insert(data).execute()
                else:
                    continue
                
                if result.data:
                    synced_count += 1
                else:
                    failed_items.append(item)
                    
            except Exception as e:
                self.logger.error(f"Failed to sync cached item: {e}")
                failed_items.append(item)
        
        # Update cache with failed items
        self.offline_cache = failed_items
        
        if synced_count > 0:
            self.logger.info(f"Synced {synced_count} cached items")
        
        return len(failed_items) == 0
    
    def run_continuous_monitoring(self):
        """Run continuous monitoring and data collection"""
        self.logger.info("Starting continuous monitoring...")
        
        # Register device on startup
        self.register_device()
        
        health_interval = 300  # 5 minutes
        sync_interval = self.config['device_settings']['sync_interval_minutes'] * 60
        
        last_health_check = 0
        last_sync = 0
        
        try:
            while True:
                current_time = time.time()
                
                # Send health metrics periodically
                if current_time - last_health_check >= health_interval:
                    self.send_health_metrics()
                    last_health_check = current_time
                
                # Sync offline data periodically
                if current_time - last_sync >= sync_interval:
                    if self.check_network_connection():
                        self.sync_offline_data()
                    last_sync = current_time
                
                # Sleep for collection interval
                time.sleep(self.config['device_settings']['collection_interval_seconds'])
                
        except KeyboardInterrupt:
            self.logger.info("Monitoring stopped by user")
        except Exception as e:
            self.logger.error(f"Monitoring error: {e}")


def main():
    """Main entry point for edge client"""
    
    # Check for configuration file
    config_file = "edge_device_config.json"
    if not os.path.exists(config_file):
        print(f"Configuration file {config_file} not found!")
        print("Please run the configuration generator first.")
        return
    
    # Check for environment variables
    if not os.getenv('SUPABASE_ANON_KEY'):
        print("SUPABASE_ANON_KEY environment variable required!")
        print("Please set this in your .env.edge file or system environment.")
        return
    
    # Initialize and run edge client
    try:
        client = ProjectScoutEdgeClient(config_file)
        client.run_continuous_monitoring()
    except Exception as e:
        print(f"Edge client error: {e}")


if __name__ == "__main__":
    main()
