#!/usr/bin/env python3
"""
Scout Device Health Summary
Enterprise-grade device monitoring with neutral terminology
"""

import json
import sys
import psutil
import datetime
from pathlib import Path

def get_device_operational_integrity():
    """Extract device operational metrics"""
    
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Temperature (if available)
    temperature = "N/A"
    try:
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    if entries:
                        temperature = f"{entries[0].current:.1f}°C"
                        break
    except:
        pass
    
    # Network connectivity
    network_active = len(psutil.net_connections()) > 0
    
    return {
        "device_id": f"Scout_Device_{hash(psutil.boot_time()) % 1000:03d}",
        "operational_status": "Online" if cpu_percent < 80 else "Warning",
        "cpu_usage_percent": round(cpu_percent, 1),
        "memory_usage_percent": round(memory.percent, 1),
        "disk_usage_percent": round(disk.percent, 1),
        "temperature": temperature,
        "network_status": "Connected" if network_active else "Disconnected",
        "last_heartbeat": datetime.datetime.utcnow().isoformat() + "Z",
        "uptime_hours": round((datetime.datetime.now() - datetime.datetime.fromtimestamp(psutil.boot_time())).total_seconds() / 3600, 1)
    }

def get_intelligence_engine_metrics():
    """Extract intelligence engine performance metrics"""
    
    # Count active processes related to the application
    node_processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            if 'node' in proc.info['name'].lower() or 'npm' in proc.info['name'].lower():
                node_processes.append({
                    "process_name": proc.info['name'],
                    "cpu_percent": proc.info['cpu_percent'] or 0,
                    "memory_percent": round(proc.info['memory_percent'] or 0, 2)
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    return {
        "active_processes": len(node_processes),
        "process_details": node_processes[:5],  # Top 5 processes
        "engine_status": "Active" if node_processes else "Standby",
        "total_cpu_usage": round(sum(p['cpu_percent'] for p in node_processes), 1),
        "total_memory_usage": round(sum(p['memory_percent'] for p in node_processes), 2)
    }

def generate_anomaly_alerts():
    """Generate system anomaly alerts"""
    
    alerts = []
    
    # Check high resource usage
    cpu_percent = psutil.cpu_percent()
    memory_percent = psutil.virtual_memory().percent
    disk_percent = psutil.disk_usage('/').percent
    
    if cpu_percent > 80:
        alerts.append({
            "type": "High CPU Usage",
            "severity": "Warning",
            "detail": f"CPU usage at {cpu_percent:.1f}%",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        })
    
    if memory_percent > 85:
        alerts.append({
            "type": "High Memory Usage", 
            "severity": "Warning",
            "detail": f"Memory usage at {memory_percent:.1f}%",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        })
    
    if disk_percent > 90:
        alerts.append({
            "type": "Critical Disk Usage",
            "severity": "Critical", 
            "detail": f"Disk usage at {disk_percent:.1f}%",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        })
    
    return alerts

def main():
    """Generate comprehensive device health summary"""
    
    print("🔧 Extracting Device Operational Integrity...")
    device_metrics = get_device_operational_integrity()
    
    print("🧠 Analyzing Intelligence Engine Performance...")
    engine_metrics = get_intelligence_engine_metrics()
    
    print("🚨 Scanning for Anomaly Alerts...")
    alerts = generate_anomaly_alerts()
    
    # Compile report
    health_report = {
        "scout_device_health": {
            "report_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "device_integrity": device_metrics,
            "intelligence_engine": engine_metrics,
            "anomaly_alerts": {
                "total_alerts": len(alerts),
                "critical_count": len([a for a in alerts if a["severity"] == "Critical"]),
                "warning_count": len([a for a in alerts if a["severity"] == "Warning"]),
                "alerts": alerts
            },
            "overall_health_score": calculate_health_score(device_metrics, alerts)
        }
    }
    
    # Output results
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        print(json.dumps(health_report, indent=2))
    else:
        print("\n" + "="*50)
        print("📊 SCOUT DEVICE HEALTH SUMMARY")
        print("="*50)
        print(f"Device ID: {device_metrics['device_id']}")
        print(f"Status: {device_metrics['operational_status']}")
        print(f"CPU: {device_metrics['cpu_usage_percent']}%")
        print(f"Memory: {device_metrics['memory_usage_percent']}%") 
        print(f"Disk: {device_metrics['disk_usage_percent']}%")
        print(f"Temperature: {device_metrics['temperature']}")
        print(f"Network: {device_metrics['network_status']}")
        print(f"Uptime: {device_metrics['uptime_hours']} hours")
        print(f"Intelligence Engine: {engine_metrics['engine_status']} ({engine_metrics['active_processes']} processes)")
        print(f"Alerts: {len(alerts)} ({len([a for a in alerts if a['severity'] == 'Critical'])} critical)")
        print(f"Health Score: {health_report['scout_device_health']['overall_health_score']}/100")

def calculate_health_score(device_metrics, alerts):
    """Calculate overall health score (0-100)"""
    
    score = 100
    
    # Deduct for high resource usage
    if device_metrics['cpu_usage_percent'] > 80:
        score -= 20
    elif device_metrics['cpu_usage_percent'] > 60:
        score -= 10
        
    if device_metrics['memory_usage_percent'] > 85:
        score -= 20
    elif device_metrics['memory_usage_percent'] > 70:
        score -= 10
        
    if device_metrics['disk_usage_percent'] > 90:
        score -= 30
    elif device_metrics['disk_usage_percent'] > 80:
        score -= 15
    
    # Deduct for alerts
    critical_alerts = len([a for a in alerts if a["severity"] == "Critical"])
    warning_alerts = len([a for a in alerts if a["severity"] == "Warning"])
    
    score -= (critical_alerts * 25)
    score -= (warning_alerts * 10)
    
    return max(0, min(100, score))

if __name__ == "__main__":
    main()