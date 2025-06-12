"""Google Drive monitoring and health reporting"""

import json
import os
import time
import subprocess
from typing import List, Dict, Any
from supabase import create_client, Client


class DriveMonitor:
    """Monitor Google Drive health and publish to Supabase"""
    
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
    
    def list_drive(self, remote: str, folder_id: str) -> List[Dict[str, Any]]:
        """List files in Google Drive using rclone"""
        try:
            cmd = [
                "rclone", "lsjson", 
                f"{remote}:{folder_id}", 
                "--recursive"
            ]
            output = subprocess.check_output(cmd, text=True)
            return json.loads(output)
        except subprocess.CalledProcessError as e:
            print(f"Error listing drive: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"Error parsing rclone output: {e}")
            return []
    
    def push_report(self, files: List[Dict[str, Any]]) -> None:
        """Push health report to Supabase"""
        now = int(time.time())
        
        # Calculate metrics
        total_files = len(files)
        total_bytes = sum(f.get("Size", 0) for f in files)
        shared_files = sum(1 for f in files if f.get("Shared", False))
        
        # File type breakdown
        file_types = {}
        for f in files:
            ext = f.get("Name", "").split(".")[-1].lower() if "." in f.get("Name", "") else "no_ext"
            file_types[ext] = file_types.get(ext, 0) + 1
        
        report_data = {
            "snapshot_ts": now,
            "file_count": total_files,
            "total_bytes": total_bytes,
            "shared": shared_files,
            "file_types": file_types,
            "last_modified": max((f.get("ModTime", "") for f in files), default=""),
        }
        
        try:
            result = self.supabase.table("drive_monitor").insert(report_data).execute()
            print(f"Health report pushed: {total_files} files, {total_bytes:,} bytes")
        except Exception as e:
            print(f"Error pushing report: {e}")
    
    def run_health_check(self, remote: str = "gdrive", folder_id: str = "") -> Dict[str, Any]:
        """Run complete health check and return metrics"""
        files = self.list_drive(remote, folder_id)
        self.push_report(files)
        
        return {
            "files": len(files),
            "total_bytes": sum(f.get("Size", 0) for f in files),
            "shared": sum(1 for f in files if f.get("Shared", False)),
            "timestamp": int(time.time())
        }


# Convenience functions for direct usage
def list_drive(remote: str, folder_id: str) -> List[Dict[str, Any]]:
    """Standalone function to list drive contents"""
    monitor = DriveMonitor()
    return monitor.list_drive(remote, folder_id)


def push_report(files: List[Dict[str, Any]]) -> None:
    """Standalone function to push health report"""
    monitor = DriveMonitor()
    monitor.push_report(files)


# CLI entry point
if __name__ == "__main__":
    import sys
    
    remote = sys.argv[1] if len(sys.argv) > 1 else "gdrive"
    folder_id = sys.argv[2] if len(sys.argv) > 2 else ""
    
    monitor = DriveMonitor()
    result = monitor.run_health_check(remote, folder_id)
    print(f"Health check complete: {result}")