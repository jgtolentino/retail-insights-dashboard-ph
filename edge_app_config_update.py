#!/usr/bin/env python3
"""
Update Edge App Configuration for Project Scout
Updates server endpoints and credentials to use Project Scout Supabase database
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EdgeAppConfigUpdater:
    """Updates edge application configuration for Project Scout"""
    
    def __init__(self):
        self.project_scout_config = {
            # Supabase Project Scout Configuration
            "supabase": {
                "project_url": "https://alxbucsacdxxwaibdxcf.supabase.co",
                "project_id": "alxbucsacdxxwaibdxcf",
                "api_url": "https://alxbucsacdxxwaibdxcf.supabase.co/rest/v1",
                "realtime_url": "wss://alxbucsacdxxwaibdxcf.supabase.co/realtime/v1",
                "auth_url": "https://alxbucsacdxxwaibdxcf.supabase.co/auth/v1"
            },
            
            # Vercel Deployment Configuration  
            "vercel": {
                "project_name": "project-scout",
                "production_url": "https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app",
                "api_endpoint": "https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app/api"
            },
            
            # Azure IoT Hub Configuration (if using)
            "azure_iot": {
                "hub_name": "ProjectScoutAutoRegHub",
                "hub_hostname": "ProjectScoutAutoRegHub.azure-devices.net",
                "event_hub_endpoint": "sb://projectscoutautoreghub.servicebus.windows.net/"
            },
            
            # Edge Device Configuration
            "edge_device": {
                "default_store_id": "store_001",
                "device_type": "RaspberryPi5",
                "firmware_version": "2.1.0",
                "data_collection_interval": 30,
                "retry_attempts": 3,
                "timeout_seconds": 10
            }
        }
    
    def generate_edge_env_file(self, output_path: str = ".env.edge"):
        """Generate .env file for edge devices"""
        
        logger.info("Generating edge device environment configuration...")
        
        env_content = f"""# Project Scout Edge Device Configuration
# Generated on: {datetime.utcnow().isoformat()}Z

# === Supabase Configuration ===
SUPABASE_URL=https://alxbucsacdxxwaibdxcf.supabase.co
SUPABASE_PROJECT_ID=alxbucsacdxxwaibdxcf
SUPABASE_API_URL=https://alxbucsacdxxwaibdxcf.supabase.co/rest/v1
SUPABASE_REALTIME_URL=wss://alxbucsacdxxwaibdxcf.supabase.co/realtime/v1
SUPABASE_AUTH_URL=https://alxbucsacdxxwaibdxcf.supabase.co/auth/v1

# === API Keys (Set these manually) ===
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# === Dashboard API Configuration ===
DASHBOARD_API_URL=https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app/api
DASHBOARD_WEB_URL=https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app

# === Azure IoT Hub Configuration ===
IOT_HUB_HOSTNAME=ProjectScoutAutoRegHub.azure-devices.net
IOT_HUB_NAME=ProjectScoutAutoRegHub
EVENT_HUB_ENDPOINT=sb://projectscoutautoreghub.servicebus.windows.net/

# === Device Configuration ===
DEVICE_TYPE=RaspberryPi5
FIRMWARE_VERSION=2.1.0
DEFAULT_STORE_ID=store_001
DATA_COLLECTION_INTERVAL=30
RETRY_ATTEMPTS=3
TIMEOUT_SECONDS=10

# === Network Configuration ===
ENABLE_WIFI_FALLBACK=true
ENABLE_CELLULAR_BACKUP=false
NETWORK_CHECK_INTERVAL=60

# === Data Storage ===
LOCAL_CACHE_SIZE_MB=500
SYNC_INTERVAL_MINUTES=5
OFFLINE_BUFFER_HOURS=24

# === Security ===
ENABLE_TLS=true
CERTIFICATE_VALIDATION=true
API_RATE_LIMIT_PER_MINUTE=60

# === Logging ===
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=7
ENABLE_TELEMETRY_LOGGING=true

# === Feature Flags ===
ENABLE_AUTO_REGISTRATION=true
ENABLE_REAL_TIME_SYNC=true
ENABLE_BATCH_UPLOAD=true
ENABLE_HEALTH_MONITORING=true
"""
        
        with open(output_path, 'w') as f:
            f.write(env_content)
        
        logger.info(f"Edge device environment file created: {output_path}")
        return output_path
    
    def generate_device_config_json(self, output_path: str = "edge_device_config.json"):
        """Generate JSON configuration file for edge devices"""
        
        logger.info("Generating edge device JSON configuration...")
        
        config = {
            "project_scout": {
                "version": "1.0.0",
                "updated": datetime.utcnow().isoformat(),
                "environment": "production"
            },
            
            "endpoints": {
                "supabase": {
                    "base_url": "https://alxbucsacdxxwaibdxcf.supabase.co",
                    "api_url": "https://alxbucsacdxxwaibdxcf.supabase.co/rest/v1",
                    "realtime_url": "wss://alxbucsacdxxwaibdxcf.supabase.co/realtime/v1",
                    "auth_url": "https://alxbucsacdxxwaibdxcf.supabase.co/auth/v1"
                },
                "dashboard": {
                    "web_url": "https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app",
                    "api_url": "https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app/api"
                },
                "azure_iot": {
                    "hub_hostname": "ProjectScoutAutoRegHub.azure-devices.net",
                    "event_hub_endpoint": "sb://projectscoutautoreghub.servicebus.windows.net/"
                }
            },
            
            "device_settings": {
                "device_type": "RaspberryPi5",
                "firmware_version": "2.1.0",
                "collection_interval_seconds": 30,
                "sync_interval_minutes": 5,
                "retry_attempts": 3,
                "timeout_seconds": 10,
                "max_offline_hours": 24
            },
            
            "data_tables": {
                "transactions": "transactions",
                "transaction_items": "transaction_items", 
                "products": "products",
                "brands": "brands",
                "stores": "stores",
                "device_health": "device_health",
                "edge_logs": "edge_logs"
            },
            
            "security": {
                "enable_tls": True,
                "certificate_validation": True,
                "api_rate_limit": 60,
                "auth_required": True
            },
            
            "features": {
                "auto_registration": True,
                "real_time_sync": True,
                "batch_upload": True,
                "health_monitoring": True,
                "wifi_fallback": True,
                "cellular_backup": False
            },
            
            "logging": {
                "level": "INFO",
                "retention_days": 7,
                "telemetry_enabled": True,
                "local_storage_mb": 100
            }
        }
        
        with open(output_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Edge device JSON configuration created: {output_path}")
        return output_path
    
    def generate_python_client(self, output_path: str = "edge_client.py"):
        """Generate Python client for edge devices"""
        
        logger.info("Generating Python edge client...")
        
        client_code = '''#!/usr/bin/env python3
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
'''
        
        with open(output_path, 'w') as f:
            f.write(client_code)
        
        os.chmod(output_path, 0o755)  # Make executable
        
        logger.info(f"Python edge client created: {output_path}")
        return output_path
    
    def generate_installation_script(self, output_path: str = "install_edge_client.sh"):
        """Generate installation script for edge devices"""
        
        logger.info("Generating edge client installation script...")
        
        script_content = '''#!/bin/bash
# Project Scout Edge Client Installation Script

set -e

echo "🚀 Installing Project Scout Edge Client..."

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️  Warning: This script is optimized for Raspberry Pi devices"
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
sudo apt install -y python3 python3-pip python3-venv

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
python3 -m venv project_scout_env
source project_scout_env/bin/activate

# Install Python packages
echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install supabase psutil requests

# Create project directory
echo "📁 Setting up project directory..."
mkdir -p ~/project_scout_edge
cd ~/project_scout_edge

# Copy configuration files (assumes they're in current directory)
if [ -f "../edge_device_config.json" ]; then
    cp ../edge_device_config.json .
fi

if [ -f "../.env.edge" ]; then
    cp ../.env.edge .
fi

if [ -f "../edge_client.py" ]; then
    cp ../edge_client.py .
    chmod +x edge_client.py
fi

# Create systemd service for auto-start
echo "⚙️  Setting up systemd service..."
sudo tee /etc/systemd/system/project-scout-edge.service > /dev/null <<EOF
[Unit]
Description=Project Scout Edge Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/project_scout_edge
Environment=PATH=/home/pi/project_scout_edge/project_scout_env/bin
ExecStart=/home/pi/project_scout_edge/project_scout_env/bin/python /home/pi/project_scout_edge/edge_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable project-scout-edge.service

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.edge file with your Supabase keys"
echo "2. Update edge_device_config.json if needed"
echo "3. Test with: python edge_client.py"
echo "4. Start service with: sudo systemctl start project-scout-edge"
echo "5. Check status with: sudo systemctl status project-scout-edge"
echo ""
echo "🔧 Configuration files:"
echo "  - ~/project_scout_edge/.env.edge"
echo "  - ~/project_scout_edge/edge_device_config.json"
echo "  - ~/project_scout_edge/edge_client.py"
'''
        
        with open(output_path, 'w') as f:
            f.write(script_content)
        
        os.chmod(output_path, 0o755)  # Make executable
        
        logger.info(f"Installation script created: {output_path}")
        return output_path
    
    def update_all_configs(self):
        """Generate all configuration files"""
        
        logger.info("🔧 Updating all edge app configurations for Project Scout...")
        
        files_created = []
        
        # Generate environment file
        files_created.append(self.generate_edge_env_file())
        
        # Generate JSON configuration
        files_created.append(self.generate_device_config_json())
        
        # Generate Python client
        files_created.append(self.generate_python_client())
        
        # Generate installation script
        files_created.append(self.generate_installation_script())
        
        # Create deployment guide
        guide_content = f'''# Project Scout Edge Device Deployment Guide

## 📋 Overview
This guide helps you deploy edge devices for Project Scout using the updated configuration.

## 🔧 Configuration Files Generated
- `.env.edge` - Environment variables for edge devices
- `edge_device_config.json` - JSON configuration file
- `edge_client.py` - Python client application
- `install_edge_client.sh` - Installation script for Raspberry Pi

## 🚀 Quick Deployment

### 1. Prepare Edge Device (Raspberry Pi)
```bash
# Copy files to Raspberry Pi
scp .env.edge edge_device_config.json edge_client.py install_edge_client.sh pi@<pi_ip>:~/

# SSH to Raspberry Pi
ssh pi@<pi_ip>
```

### 2. Install Edge Client
```bash
# Run installation script
chmod +x install_edge_client.sh
./install_edge_client.sh
```

### 3. Configure Credentials
```bash
# Edit environment file
nano .env.edge

# Add your Supabase keys:
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### 4. Start Edge Client
```bash
# Test manually first
cd ~/project_scout_edge
source project_scout_env/bin/activate
python edge_client.py

# If working, start as service
sudo systemctl start project-scout-edge
sudo systemctl status project-scout-edge
```

## 📊 Project Scout Endpoints

### Supabase (Database)
- **URL**: https://alxbucsacdxxwaibdxcf.supabase.co
- **API**: https://alxbucsacdxxwaibdxcf.supabase.co/rest/v1
- **Realtime**: wss://alxbucsacdxxwaibdxcf.supabase.co/realtime/v1

### Dashboard (Vercel)
- **URL**: https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app
- **API**: https://retail-insights-dashboard-ph-jakes-projects-e9f46c30.vercel.app/api

### Azure IoT Hub (Optional)
- **Hostname**: ProjectScoutAutoRegHub.azure-devices.net
- **Event Hub**: sb://projectscoutautoreghub.servicebus.windows.net/

## 🔐 Security Notes

1. **Keep API Keys Secure**: Never commit .env files to git
2. **Use Service Role Key**: For edge devices with write access
3. **Enable TLS**: All connections use HTTPS/WSS
4. **Network Security**: Configure firewall rules as needed

## 📝 Data Tables

Edge devices will write to these Supabase tables:
- `transactions` - Sale transaction data
- `transaction_items` - Individual items in transactions
- `product_detections` - AI-detected products
- `device_health` - Device monitoring data
- `devices` - Device registration information

## 🔧 Troubleshooting

### Check Service Status
```bash
sudo systemctl status project-scout-edge
sudo journalctl -u project-scout-edge -f
```

### Test Network Connection
```bash
curl https://alxbucsacdxxwaibdxcf.supabase.co
```

### Verify Configuration
```bash
cd ~/project_scout_edge
source project_scout_env/bin/activate
python -c "import json; print(json.load(open('edge_device_config.json')))"
```

## 📞 Support

For issues with edge device deployment:
1. Check systemd logs: `journalctl -u project-scout-edge`
2. Verify network connectivity to Supabase
3. Ensure API keys are correctly set
4. Check device registration in Project Scout dashboard

---
**Updated**: {datetime.utcnow().isoformat()}Z
**Version**: 1.0.0
**Environment**: Production (Project Scout)
'''
        
        with open("EDGE_DEPLOYMENT_GUIDE.md", 'w') as f:
            f.write(guide_content)
        
        files_created.append("EDGE_DEPLOYMENT_GUIDE.md")
        
        logger.info("✅ All edge app configurations updated successfully!")
        logger.info("📁 Files created:")
        for file_path in files_created:
            logger.info(f"   - {file_path}")
        
        return files_created


def main():
    """Main entry point"""
    updater = EdgeAppConfigUpdater()
    files_created = updater.update_all_configs()
    
    print("\n🎉 Edge app configuration update complete!")
    print("\n📋 Next steps:")
    print("1. Get Supabase API keys from: https://app.supabase.com/project/alxbucsacdxxwaibdxcf/settings/api")
    print("2. Update .env.edge file with actual API keys")
    print("3. Deploy to Raspberry Pi devices using install_edge_client.sh")
    print("4. Monitor device registrations in Project Scout dashboard")
    
    print(f"\n📁 Configuration files ready in: {os.getcwd()}")


if __name__ == "__main__":
    main()