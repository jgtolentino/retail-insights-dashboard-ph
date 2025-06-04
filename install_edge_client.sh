#!/bin/bash
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
