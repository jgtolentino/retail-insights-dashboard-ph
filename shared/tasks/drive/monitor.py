"""Drive monitoring task for Pulser pipelines"""

from typing import Dict, Any
from shared.drive_monitor.publisher import DriveMonitor


def run(remote: str, folder_id: str) -> Dict[str, Any]:
    """
    Pulser task to monitor Google Drive health
    
    Args:
        remote: rclone remote name (e.g., 'gdrive')
        folder_id: Google Drive folder ID to monitor
        
    Returns:
        Dict with health metrics
    """
    monitor = DriveMonitor()
    result = monitor.run_health_check(remote, folder_id)
    
    return {
        "files": result["files"],
        "total_bytes": result["total_bytes"],
        "shared": result["shared"],
        "timestamp": result["timestamp"],
        "status": "success"
    }