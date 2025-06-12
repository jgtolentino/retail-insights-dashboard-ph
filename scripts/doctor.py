#!/usr/bin/env python3
"""
AI-Agency Health Check Script
Comprehensive system health verification
"""

import os
import sys
import subprocess
import json
from typing import Dict, List, Tuple


class HealthChecker:
    def __init__(self):
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = []

    def check_command(self, command: str, name: str) -> bool:
        """Check if a command exists and is accessible"""
        try:
            result = subprocess.run(
                command.split(), 
                capture_output=True, 
                text=True, 
                timeout=10
            )
            print(f"✅ {name}: Available")
            self.checks_passed += 1
            return True
        except (subprocess.TimeoutExpired, FileNotFoundError):
            print(f"❌ {name}: Not found or not working")
            self.checks_failed += 1
            return False

    def check_env_var(self, var_name: str, required: bool = True) -> bool:
        """Check if environment variable is set"""
        value = os.getenv(var_name)
        if value:
            print(f"✅ {var_name}: Set")
            self.checks_passed += 1
            return True
        else:
            if required:
                print(f"❌ {var_name}: Missing (required)")
                self.checks_failed += 1
            else:
                print(f"⚠️  {var_name}: Missing (optional)")
                self.warnings.append(f"{var_name} not set")
            return False

    def check_file_exists(self, filepath: str, name: str) -> bool:
        """Check if file exists"""
        if os.path.exists(filepath):
            print(f"✅ {name}: Found")
            self.checks_passed += 1
            return True
        else:
            print(f"❌ {name}: Missing")
            self.checks_failed += 1
            return False

    def check_node_version(self) -> bool:
        """Check Node.js version is 20+"""
        try:
            result = subprocess.run(
                ["node", "--version"], 
                capture_output=True, 
                text=True
            )
            version_str = result.stdout.strip()
            version_num = int(version_str.replace('v', '').split('.')[0])
            
            if version_num >= 20:
                print(f"✅ Node.js: {version_str} (>= 20)")
                self.checks_passed += 1
                return True
            else:
                print(f"❌ Node.js: {version_str} (need >= 20)")
                self.checks_failed += 1
                return False
                
        except (subprocess.CalledProcessError, ValueError, FileNotFoundError):
            print("❌ Node.js: Not found or invalid version")
            self.checks_failed += 1
            return False

    def check_python_version(self) -> bool:
        """Check Python version is 3.11+"""
        version = sys.version_info
        if version.major == 3 and version.minor >= 11:
            print(f"✅ Python: {version.major}.{version.minor}.{version.micro} (>= 3.11)")
            self.checks_passed += 1
            return True
        else:
            print(f"❌ Python: {version.major}.{version.minor}.{version.micro} (need >= 3.11)")
            self.checks_failed += 1
            return False

    def run_all_checks(self) -> None:
        """Run comprehensive health check"""
        print("🔍 AI-Agency Health Check Starting...\n")

        # System Requirements
        print("📋 System Requirements:")
        self.check_python_version()
        self.check_node_version()
        self.check_command("git --version", "Git")
        self.check_command("docker --version", "Docker")
        self.check_command("task --version", "Task CLI")
        
        print("\n🔧 Development Tools:")
        self.check_command("rclone version", "rclone")
        self.check_command("npm --version", "npm")
        self.check_command("pnpm --version", "pnpm")
        
        print("\n📁 Project Structure:")
        self.check_file_exists("Taskfile.yml", "Taskfile")
        self.check_file_exists("package.json", "package.json")
        self.check_file_exists(".devcontainer/devcontainer.json", "Dev Container Config")
        self.check_file_exists("docs/GETTING_STARTED.md", "Getting Started Guide")
        
        print("\n🔐 Environment Variables:")
        self.check_env_var("SUPABASE_URL")
        self.check_env_var("SUPABASE_SERVICE_ROLE_KEY")
        self.check_env_var("VITE_SUPABASE_URL")
        self.check_env_var("VITE_SUPABASE_ANON_KEY")
        self.check_env_var("OPENAI_API_KEY", required=False)
        self.check_env_var("AZURE_OPENAI_API_KEY", required=False)
        
        print("\n📊 Service Health:")
        self.check_supabase_connection()
        
        # Summary
        print("\n" + "="*50)
        print("📋 HEALTH CHECK SUMMARY")
        print("="*50)
        print(f"✅ Passed: {self.checks_passed}")
        print(f"❌ Failed: {self.checks_failed}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        
        if self.warnings:
            print("\n⚠️  Warnings:")
            for warning in self.warnings:
                print(f"   - {warning}")
        
        if self.checks_failed == 0:
            print("\n🎉 All critical checks passed! System is healthy.")
            sys.exit(0)
        else:
            print(f"\n💥 {self.checks_failed} critical issues found. Please fix before proceeding.")
            sys.exit(1)

    def check_supabase_connection(self) -> bool:
        """Test Supabase connection"""
        try:
            # This would require supabase-py to be installed
            # For now, just check if credentials are set
            if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
                print("✅ Supabase: Credentials configured")
                self.checks_passed += 1
                return True
            else:
                print("❌ Supabase: Missing credentials")
                self.checks_failed += 1
                return False
        except Exception as e:
            print(f"❌ Supabase: Connection failed - {e}")
            self.checks_failed += 1
            return False


def main():
    """Main entry point"""
    checker = HealthChecker()
    checker.run_all_checks()


if __name__ == "__main__":
    main()