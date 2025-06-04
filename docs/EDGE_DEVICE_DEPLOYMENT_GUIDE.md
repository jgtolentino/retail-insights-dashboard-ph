# Edge Device Deployment Guide

## 📋 Field Technician Guidelines

### Prerequisites

Before beginning edge device deployment, ensure you have:

- [ ] Raspberry Pi 5 (8GB RAM recommended)
- [ ] MicroSD card (64GB Class 10 minimum)
- [ ] Power supply (5V 5A USB-C)
- [ ] Ethernet cable or WiFi credentials
- [ ] Project Scout credentials
- [ ] This deployment guide

### Hardware Setup

#### 1. Raspberry Pi Preparation

```bash
# Flash Raspberry Pi OS to SD card
# Use Raspberry Pi Imager: https://rpi.org/imager
# Enable SSH in advanced options
# Set username: projectscout
# Set password: [Use company standard]
```

#### 2. Initial Boot Configuration

```bash
# Connect via SSH
ssh projectscout@[device-ip]

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install python3-pip git curl htop python3-venv -y

# Install Python dependencies
pip3 install psutil supabase-py python-dotenv requests

# For local LLM/NLP processing (optional)
pip3 install transformers torch ollama-python nltk spacy
```

#### 3. Local LLM/NLP Setup (Optional)

For stores requiring local NLU/NLP processing without internet dependency:

```bash
# Install Ollama for local LLM inference
curl -fsSL https://ollama.ai/install.sh | sh

# Download lightweight models for edge processing
ollama pull phi3:mini          # 2.3GB - General purpose
ollama pull llama3.2:1b       # 1.3GB - Ultra lightweight
ollama pull nomic-embed-text   # 274MB - Text embeddings

# Install spaCy language models
python3 -m spacy download en_core_web_sm

# Create NLP processing directory
mkdir -p /home/projectscout/edge-client/nlp
```

#### 4. NLP Configuration for Edge Processing

```bash
# Create local NLP configuration
cat > /home/projectscout/edge-client/nlp_config.json << 'EOF'
{
  "local_processing": {
    "enabled": true,
    "models": {
      "sentiment": "phi3:mini",
      "classification": "llama3.2:1b",
      "embeddings": "nomic-embed-text",
      "ner": "en_core_web_sm"
    },
    "fallback_to_cloud": true,
    "confidence_threshold": 0.7
  },
  "processing_tasks": {
    "customer_feedback": {
      "model": "phi3:mini",
      "prompt_template": "Analyze customer sentiment: {text}",
      "max_tokens": 100
    },
    "product_classification": {
      "model": "llama3.2:1b",
      "prompt_template": "Classify product category: {text}",
      "max_tokens": 50
    },
    "brand_extraction": {
      "model": "en_core_web_sm",
      "use_spacy": true,
      "extract_entities": ["ORG", "PRODUCT"]
    }
  }
}
EOF
```

### Software Installation

#### 1. Download Edge Client

```bash
# Create project directory
mkdir -p /home/projectscout/edge-client
cd /home/projectscout/edge-client

# Download edge client files
curl -O https://raw.githubusercontent.com/[your-repo]/retail-insights-dashboard-ph/main/edge_client.py
curl -O https://raw.githubusercontent.com/[your-repo]/retail-insights-dashboard-ph/main/.env.edge
curl -O https://raw.githubusercontent.com/[your-repo]/retail-insights-dashboard-ph/main/edge_device_config.json
```

#### 2. Configuration

```bash
# Edit environment file
nano .env.edge

# Update these values:
SUPABASE_ANON_KEY=[get-from-dashboard]
SUPABASE_SERVICE_ROLE_KEY=[get-from-dashboard]
DEFAULT_STORE_ID=[store-specific-id]
```

#### 3. Service Setup

```bash
# Create systemd service
sudo nano /etc/systemd/system/edge-client.service
```

Add this content:

```ini
[Unit]
Description=Project Scout Edge Client
After=network.target
Wants=network.target

[Service]
Type=simple
User=projectscout
WorkingDirectory=/home/projectscout/edge-client
Environment=PYTHONPATH=/home/projectscout/edge-client
ExecStart=/usr/bin/python3 edge_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable edge-client
sudo systemctl start edge-client
```

### Device Registration

#### 1. Verify Device Registration

```bash
# Check service status
sudo systemctl status edge-client

# View logs
sudo journalctl -u edge-client -f

# Expected output:
# ✅ Device registered: Pi5_Edge_[unique-id]
# ✅ Health monitoring started
# ✅ Product detection ready
```

#### 2. Test Device Functionality

```bash
# Run test script
python3 -c "
import subprocess
import json

# Test device info
result = subprocess.run(['python3', 'edge_client.py', '--test'], capture_output=True, text=True)
print('Test Result:', result.stdout)
"
```

### Network Configuration

#### WiFi Setup (if ethernet not available)

```bash
# Configure WiFi
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf

# Add network:
network={
    ssid="Store-WiFi-Network"
    psk="wifi-password"
    priority=1
}

# Restart networking
sudo systemctl restart dhcpcd
```

#### Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 22    # SSH
sudo ufw allow 443   # HTTPS
sudo ufw allow 80    # HTTP
sudo ufw enable
```

### Store-Specific Configuration

#### Setting Store Information

```bash
# Update store configuration
nano edge_device_config.json

# Update these fields:
{
  "device_settings": {
    "store_id": "store_[location_code]",
    "location": "Store Name - City",
    "collection_interval_seconds": 30
  }
}
```

### Verification Checklist

After deployment, verify:

- [ ] Device appears in Project Scout dashboard
- [ ] Health monitoring data is being collected
- [ ] Device logs are being sent to central system
- [ ] Network connectivity is stable
- [ ] Service starts automatically on boot
- [ ] Camera (if applicable) is functioning
- [ ] Local storage has sufficient space
- [ ] Local NLP models (if enabled) are functioning

## 🧠 Local LLM/NLP Processing Note

**For Advanced Deployments:** Edge devices can be configured with local Natural Language Understanding (NLU) and Natural Language Processing (NLP) capabilities for:

- **Customer feedback sentiment analysis** - Process customer comments locally without sending data to cloud
- **Product mention extraction** - Identify brand and product names from voice/text input
- **Real-time classification** - Categorize customer interactions on-device
- **Privacy-first processing** - Keep sensitive customer data on local device

**Models Supported:**

- **Ollama**: phi3:mini (2.3GB), llama3.2:1b (1.3GB) for general NLP
- **spaCy**: en_core_web_sm for entity recognition
- **Transformers**: lightweight sentiment analysis models

**Requirements:**

- Raspberry Pi 5 with 8GB RAM (minimum for local LLM)
- 32GB+ additional storage for models
- Stable power supply (models are CPU intensive)

**Benefits:**

- Reduced cloud API costs
- Faster processing (no network latency)
- Enhanced privacy compliance
- Offline capability for remote locations

**Configuration:**
Local NLP can be enabled per store based on requirements. Contact technical team for setup assistance and model optimization for specific use cases.

## 🔧 Troubleshooting Procedures

### Common Issues

#### 1. Device Not Registering

**Symptoms:**

- Device not appearing in dashboard
- Registration errors in logs

**Solutions:**

```bash
# Check network connectivity
ping google.com

# Verify Supabase credentials
curl -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
     https://lcoxtanyckjzyxxcsjzz.supabase.co/rest/v1/devices

# Check device ID generation
python3 -c "
import uuid
import hashlib
mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0,8*6,8)][::-1])
print('MAC Address:', mac)
device_hash = hashlib.sha256(mac.encode()).hexdigest()[:12]
print('Device ID: Pi5_Edge_' + device_hash)
"
```

#### 2. High CPU/Memory Usage

**Symptoms:**

- Device running slowly
- High temperature warnings

**Solutions:**

```bash
# Check resource usage
htop

# Reduce collection frequency
nano edge_device_config.json
# Increase "collection_interval_seconds" to 60 or 120

# Monitor temperature
vcgencmd measure_temp

# If overheating, check ventilation and reduce CPU frequency
echo "arm_freq=1000" | sudo tee -a /boot/config.txt
```

#### 3. Network Connectivity Issues

**Symptoms:**

- Intermittent data sync failures
- Network timeout errors

**Solutions:**

```bash
# Check WiFi signal strength
iwconfig wlan0

# Test DNS resolution
nslookup lcoxtanyckjzyxxcsjzz.supabase.co

# Check for IP conflicts
ip addr show

# Reset network interface
sudo ifdown wlan0 && sudo ifup wlan0
```

#### 4. Service Not Starting

**Symptoms:**

- Edge client service fails to start
- Permission errors

**Solutions:**

```bash
# Check service logs
sudo journalctl -u edge-client -n 50

# Verify file permissions
ls -la /home/projectscout/edge-client/

# Fix permissions if needed
sudo chown -R projectscout:projectscout /home/projectscout/edge-client/
chmod +x edge_client.py

# Check Python path
which python3
```

#### 5. Database Connection Errors

**Symptoms:**

- "Connection refused" errors
- Authentication failures

**Solutions:**

```bash
# Test API connection
curl -I https://lcoxtanyckjzyxxcsjzz.supabase.co

# Verify API keys (check .env.edge)
grep -E "SUPABASE.*KEY" .env.edge

# Test with valid credentials
python3 -c "
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')

try:
    supabase = create_client(url, key)
    result = supabase.table('devices').select('count', count='exact').execute()
    print('✅ Database connection successful')
except Exception as e:
    print('❌ Database connection failed:', e)
"
```

#### 6. Local LLM/NLP Issues (If Enabled)

**Symptoms:**

- High memory usage (>80%)
- Ollama service not responding
- Model loading failures

**Solutions:**

```bash
# Check Ollama service status
sudo systemctl status ollama

# Restart Ollama if needed
sudo systemctl restart ollama

# Check available models
ollama list

# Test model inference
ollama run phi3:mini "Hello, test message"

# Monitor memory usage during processing
htop

# Reduce model load if memory constrained
ollama rm llama3.2:1b  # Remove larger models if needed
```

**Note:** Local LLM processing requires 8GB+ RAM. Disable if device has insufficient memory or experiencing performance issues.

### Diagnostic Commands

#### System Health Check

```bash
#!/bin/bash
# Run comprehensive health check

echo "=== System Information ==="
uname -a
df -h
free -h
uptime

echo -e "\n=== Network Status ==="
ip addr show
ping -c 3 google.com

echo -e "\n=== Service Status ==="
sudo systemctl status edge-client

echo -e "\n=== Recent Logs ==="
sudo journalctl -u edge-client -n 10 --no-pager

echo -e "\n=== Python Environment ==="
python3 --version
pip3 list | grep -E "(supabase|psutil|dotenv)"

echo -e "\n=== Device Configuration ==="
cat edge_device_config.json | python3 -m json.tool
```

#### Log Analysis

```bash
# Real-time log monitoring
sudo journalctl -u edge-client -f

# Search for specific errors
sudo journalctl -u edge-client | grep -i error

# Check system logs for hardware issues
dmesg | tail -20
```

### Emergency Procedures

#### 1. Factory Reset

```bash
# Stop service
sudo systemctl stop edge-client

# Backup configuration
cp .env.edge .env.edge.backup
cp edge_device_config.json edge_device_config.json.backup

# Reinstall edge client
rm -rf /home/projectscout/edge-client/*
# Re-run installation process
```

#### 2. Remote Support Access

```bash
# Enable reverse SSH tunnel (if configured)
ssh -R 19999:localhost:22 support@central-server.com

# Or use TeamViewer/VNC for GUI access
sudo apt install xrdp -y
sudo systemctl enable xrdp
```

### Performance Monitoring

#### Key Metrics to Monitor

```bash
# CPU Usage (should be < 50%)
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

# Memory Usage (should be < 80%)
free | grep Mem | awk '{printf "%.1f%%\n", $3/$2 * 100.0}'

# Temperature (should be < 70°C)
vcgencmd measure_temp

# Disk Usage (should be < 80%)
df -h / | awk 'NR==2{printf "%s\n", $5}'

# Network Latency to Supabase
ping -c 5 lcoxtanyckjzyxxcsjzz.supabase.co | tail -1 | awk -F'/' '{print $5}'
```

### Contact Information

**Technical Support:**

- Email: edge-support@projectscout.com
- Phone: +63-XXX-XXX-XXXX
- Slack: #edge-device-support

**Emergency Escalation:**

- Technical Lead: [Name] - [Phone]
- DevOps Team: [Email]
- Project Manager: [Name] - [Email]

**Remote Access:**

- TeamViewer ID: [If configured]
- VPN Access: [If configured]
- SSH Jump Host: [If configured]

---

_Last Updated: 2025-06-04_
_Version: 1.0_
_Author: Project Scout Development Team_
