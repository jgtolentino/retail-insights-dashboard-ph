#!/usr/bin/env python3
"""
Caca QA Audit Script for CI/CD Pipeline
Comprehensive Quality Assurance validation for retail insights dashboard
"""

import os
import sys
import json
import requests
import time
import subprocess
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

class CacaAudit:
    def __init__(self):
        self.base_url = os.getenv('VERCEL_PREVIEW_URL', 'http://localhost:4173')
        self.errors = []
        self.warnings = []
        self.passed_checks = []
        
    def log_pass(self, check_name, details=""):
        """Log a passed check"""
        self.passed_checks.append(f"✅ {check_name}: {details}")
        print(f"✅ {check_name}: {details}")
        
    def log_warning(self, check_name, details=""):
        """Log a warning"""
        self.warnings.append(f"⚠️  {check_name}: {details}")
        print(f"⚠️  {check_name}: {details}")
        
    def log_error(self, check_name, details=""):
        """Log an error"""
        self.errors.append(f"❌ {check_name}: {details}")
        print(f"❌ {check_name}: {details}")
        
    def check_health_endpoint(self):
        """Check if health endpoint is responding"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_pass("Health Endpoint", f"Status {response.status_code}")
                return True
            else:
                self.log_error("Health Endpoint", f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Health Endpoint", f"Connection failed: {str(e)}")
            return False
            
    def check_main_page_load(self):
        """Check if main dashboard page loads properly"""
        try:
            response = requests.get(self.base_url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Check for React app mount point
                root_div = soup.find('div', {'id': 'root'})
                if root_div and len(root_div.get_text().strip()) > 0:
                    self.log_pass("Main Page Load", "React app mounted successfully")
                    return True
                else:
                    self.log_error("Main Page Load", "React app not mounted or empty")
                    return False
            else:
                self.log_error("Main Page Load", f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_error("Main Page Load", f"Failed to load: {str(e)}")
            return False
            
    def check_dashboard_routes(self):
        """Check key dashboard routes are accessible"""
        routes_to_check = [
            '/',
            '/dashboard-preview',
            '/trends',
            '/consumer-insights',
            '/product-insights'
        ]
        
        passed_routes = 0
        for route in routes_to_check:
            try:
                url = urljoin(self.base_url, route)
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    self.log_pass(f"Route {route}", f"Status {response.status_code}")
                    passed_routes += 1
                else:
                    self.log_warning(f"Route {route}", f"Status {response.status_code}")
            except Exception as e:
                self.log_warning(f"Route {route}", f"Failed: {str(e)}")
                
        return passed_routes >= len(routes_to_check) * 0.8  # 80% success rate
        
    def check_api_endpoints(self):
        """Check critical API endpoints"""
        api_endpoints = [
            '/api/health',
            '/api/chat'
        ]
        
        passed_apis = 0
        for endpoint in api_endpoints:
            try:
                url = urljoin(self.base_url, endpoint)
                response = requests.get(url, timeout=10)
                if response.status_code in [200, 201, 404]:  # 404 is ok for some endpoints
                    self.log_pass(f"API {endpoint}", f"Status {response.status_code}")
                    passed_apis += 1
                else:
                    self.log_warning(f"API {endpoint}", f"Status {response.status_code}")
            except Exception as e:
                self.log_warning(f"API {endpoint}", f"Failed: {str(e)}")
                
        return passed_apis >= len(api_endpoints) * 0.5  # 50% success rate for APIs
        
    def check_performance_metrics(self):
        """Check basic performance metrics"""
        try:
            start_time = time.time()
            response = requests.get(self.base_url, timeout=15)
            load_time = time.time() - start_time
            
            if load_time < 5.0:
                self.log_pass("Performance", f"Load time: {load_time:.2f}s")
                return True
            elif load_time < 10.0:
                self.log_warning("Performance", f"Slow load time: {load_time:.2f}s")
                return True
            else:
                self.log_error("Performance", f"Very slow load time: {load_time:.2f}s")
                return False
        except Exception as e:
            self.log_error("Performance", f"Failed to measure: {str(e)}")
            return False
            
    def check_security_headers(self):
        """Check for basic security headers"""
        try:
            response = requests.get(self.base_url, timeout=10)
            headers = response.headers
            
            security_checks = {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
                'X-XSS-Protection': '1; mode=block'
            }
            
            security_score = 0
            total_checks = len(security_checks)
            
            for header, expected in security_checks.items():
                if header in headers:
                    if isinstance(expected, list):
                        if headers[header] in expected:
                            security_score += 1
                    else:
                        if headers[header] == expected:
                            security_score += 1
                            
            if security_score >= total_checks * 0.5:
                self.log_pass("Security Headers", f"{security_score}/{total_checks} headers present")
                return True
            else:
                self.log_warning("Security Headers", f"Only {security_score}/{total_checks} headers present")
                return False
        except Exception as e:
            self.log_warning("Security Headers", f"Failed to check: {str(e)}")
            return False
            
    def check_javascript_errors(self):
        """Check for console errors (basic check)"""
        try:
            response = requests.get(self.base_url, timeout=10)
            # Look for common error patterns in the HTML
            error_patterns = [
                'Uncaught TypeError',
                'Uncaught ReferenceError',
                'Uncaught SyntaxError',
                'Failed to fetch',
                'ERR_',
                'ERROR:'
            ]
            
            found_errors = []
            for pattern in error_patterns:
                if pattern in response.text:
                    found_errors.append(pattern)
                    
            if not found_errors:
                self.log_pass("JavaScript Errors", "No obvious errors in page source")
                return True
            else:
                self.log_warning("JavaScript Errors", f"Potential errors found: {', '.join(found_errors)}")
                return False
        except Exception as e:
            self.log_warning("JavaScript Errors", f"Failed to check: {str(e)}")
            return False
            
    def check_environment_variables(self):
        """Check for required environment variables"""
        required_env_vars = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY'
        ]
        
        missing_vars = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_vars.append(var)
                
        if not missing_vars:
            self.log_pass("Environment Variables", "All required variables present")
            return True
        else:
            self.log_warning("Environment Variables", f"Missing: {', '.join(missing_vars)}")
            return False
            
    def run_audit(self):
        """Run complete audit suite"""
        print("🔍 Starting Caca QA Audit...")
        print(f"🌐 Base URL: {self.base_url}")
        print("-" * 50)
        
        # Run all checks
        checks = [
            self.check_health_endpoint,
            self.check_main_page_load,
            self.check_dashboard_routes,
            self.check_api_endpoints,
            self.check_performance_metrics,
            self.check_security_headers,
            self.check_javascript_errors,
            self.check_environment_variables
        ]
        
        passed_checks = 0
        total_checks = len(checks)
        
        for check in checks:
            try:
                if check():
                    passed_checks += 1
            except Exception as e:
                self.log_error(f"Check {check.__name__}", f"Exception: {str(e)}")
                
        # Generate summary
        print("\n" + "=" * 50)
        print("📊 AUDIT SUMMARY")
        print("=" * 50)
        
        print(f"\n✅ PASSED CHECKS ({len(self.passed_checks)}):")
        for check in self.passed_checks:
            print(f"  {check}")
            
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  {warning}")
                
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  {error}")
                
        # Calculate score
        score = (passed_checks / total_checks) * 100
        print(f"\n🎯 OVERALL SCORE: {score:.1f}% ({passed_checks}/{total_checks} checks passed)")
        
        # Determine exit status
        if score >= 80.0:
            print("🎉 AUDIT PASSED - Application is ready for deployment!")
            return 0
        elif score >= 60.0:
            print("⚠️  AUDIT WARNING - Application has issues but may proceed")
            return 0  # Allow deployment with warnings
        else:
            print("🚫 AUDIT FAILED - Application is not ready for deployment")
            return 1

def main():
    """Main entry point"""
    audit = CacaAudit()
    exit_code = audit.run_audit()
    sys.exit(exit_code)

if __name__ == "__main__":
    main()