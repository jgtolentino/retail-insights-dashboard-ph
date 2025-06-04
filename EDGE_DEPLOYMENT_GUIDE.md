# Project Scout Edge Device Deployment Guide

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

**Updated**: 2025-06-04T13:19:27.647904Z
**Version**: 1.0.0
**Environment**: Production (Project Scout)
