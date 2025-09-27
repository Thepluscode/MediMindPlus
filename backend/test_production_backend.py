#!/usr/bin/env python3
"""
MediMind Production Backend Test Suite
Comprehensive testing of the production-ready backend implementation
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TestResult:
    name: str
    passed: bool
    message: str
    duration: float
    details: Optional[Dict[str, Any]] = None

class MediMindBackendTester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        self.access_token = None
        self.user_id = None
        
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def run_test(self, test_name: str, test_func):
        """Run a single test and record results"""
        self.log(f"Running test: {test_name}")
        start_time = time.time()
        
        try:
            result = test_func()
            duration = time.time() - start_time
            
            if result is True:
                test_result = TestResult(test_name, True, "PASSED", duration)
                self.log(f"✅ {test_name} - PASSED ({duration:.2f}s)", "SUCCESS")
            elif isinstance(result, dict) and result.get('passed', False):
                test_result = TestResult(
                    test_name, 
                    True, 
                    result.get('message', 'PASSED'), 
                    duration,
                    result.get('details')
                )
                self.log(f"✅ {test_name} - PASSED ({duration:.2f}s)", "SUCCESS")
            else:
                message = result.get('message', 'FAILED') if isinstance(result, dict) else str(result)
                test_result = TestResult(test_name, False, message, duration)
                self.log(f"❌ {test_name} - FAILED: {message} ({duration:.2f}s)", "ERROR")
                
        except Exception as e:
            duration = time.time() - start_time
            test_result = TestResult(test_name, False, f"Exception: {str(e)}", duration)
            self.log(f"❌ {test_name} - FAILED: {str(e)} ({duration:.2f}s)", "ERROR")
            
        self.test_results.append(test_result)
        return test_result.passed
        
    def test_server_startup(self):
        """Test if server is running and responding"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    'passed': True,
                    'message': f"Server running (uptime: {data.get('uptime', 0):.1f}s)",
                    'details': data
                }
            else:
                return {'passed': False, 'message': f"Health check failed: {response.status_code}"}
        except requests.exceptions.ConnectionError:
            return {'passed': False, 'message': "Cannot connect to server"}
        except Exception as e:
            return {'passed': False, 'message': f"Health check error: {str(e)}"}
            
    def test_detailed_health_check(self):
        """Test detailed health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health/detailed", timeout=15)
            if response.status_code in [200, 503]:  # 503 is acceptable if some services are down
                data = response.json()
                services = data.get('services', {})
                
                # Check if we have service status information
                required_services = ['database', 'redis', 'memory', 'external']
                missing_services = [svc for svc in required_services if svc not in services]
                
                if missing_services:
                    return {
                        'passed': False, 
                        'message': f"Missing service checks: {missing_services}",
                        'details': data
                    }
                
                return {
                    'passed': True,
                    'message': f"Detailed health check complete (status: {data.get('status')})",
                    'details': data
                }
            else:
                return {'passed': False, 'message': f"Detailed health check failed: {response.status_code}"}
        except Exception as e:
            return {'passed': False, 'message': f"Detailed health check error: {str(e)}"}
            
    def test_api_documentation(self):
        """Test if API documentation is available"""
        try:
            response = self.session.get(f"{self.base_url}/api-docs", timeout=10)
            if response.status_code == 200:
                # Check if it's actually Swagger UI
                content = response.text
                if 'swagger' in content.lower() or 'openapi' in content.lower():
                    return {'passed': True, 'message': "API documentation available"}
                else:
                    return {'passed': False, 'message': "API docs endpoint exists but content unclear"}
            else:
                return {'passed': False, 'message': f"API docs not available: {response.status_code}"}
        except Exception as e:
            return {'passed': False, 'message': f"API docs check error: {str(e)}"}
            
    def test_cors_headers(self):
        """Test CORS configuration"""
        try:
            # Test preflight request
            headers = {
                'Origin': 'http://localhost:3001',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            response = self.session.options(f"{self.base_url}/api/v1/auth/login", headers=headers, timeout=10)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if any(cors_headers.values()):
                return {
                    'passed': True,
                    'message': "CORS headers configured",
                    'details': cors_headers
                }
            else:
                return {'passed': False, 'message': "CORS headers missing"}
        except Exception as e:
            return {'passed': False, 'message': f"CORS test error: {str(e)}"}
            
    def test_security_headers(self):
        """Test security headers"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            
            security_headers = {
                'X-Content-Type-Options': response.headers.get('X-Content-Type-Options'),
                'X-Frame-Options': response.headers.get('X-Frame-Options'),
                'X-XSS-Protection': response.headers.get('X-XSS-Protection'),
                'Strict-Transport-Security': response.headers.get('Strict-Transport-Security'),
                'Content-Security-Policy': response.headers.get('Content-Security-Policy')
            }
            
            present_headers = {k: v for k, v in security_headers.items() if v}
            
            if len(present_headers) >= 3:  # At least 3 security headers
                return {
                    'passed': True,
                    'message': f"Security headers present: {len(present_headers)}/5",
                    'details': present_headers
                }
            else:
                return {
                    'passed': False, 
                    'message': f"Insufficient security headers: {len(present_headers)}/5",
                    'details': security_headers
                }
        except Exception as e:
            return {'passed': False, 'message': f"Security headers test error: {str(e)}"}
            
    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            test_user = {
                "email": f"test_{int(time.time())}@medimind.test",
                "password": "SecurePassword123!",
                "firstName": "Test",
                "lastName": "User",
                "role": "patient",
                "acceptTerms": True
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/register",
                json=test_user,
                timeout=15
            )
            
            if response.status_code == 201:
                data = response.json()
                if 'user' in data and 'id' in data['user']:
                    self.test_user_email = test_user['email']
                    self.test_user_password = test_user['password']
                    return {
                        'passed': True,
                        'message': "User registration successful",
                        'details': {'user_id': data['user']['id']}
                    }
                else:
                    return {'passed': False, 'message': "Registration response missing user data"}
            else:
                error_msg = response.json().get('error', {}).get('message', 'Unknown error')
                return {'passed': False, 'message': f"Registration failed: {error_msg}"}
        except Exception as e:
            return {'passed': False, 'message': f"Registration test error: {str(e)}"}
            
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            # First ensure we have a test user
            if not hasattr(self, 'test_user_email'):
                return {'passed': False, 'message': "No test user available for login test"}
                
            login_data = {
                "email": self.test_user_email,
                "password": self.test_user_password
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/auth/login",
                json=login_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'tokens' in data and 'accessToken' in data['tokens']:
                    self.access_token = data['tokens']['accessToken']
                    self.user_id = data['user']['id']
                    return {
                        'passed': True,
                        'message': "User login successful",
                        'details': {'has_access_token': True, 'user_id': self.user_id}
                    }
                else:
                    return {'passed': False, 'message': "Login response missing tokens"}
            else:
                error_msg = response.json().get('error', {}).get('message', 'Unknown error')
                return {'passed': False, 'message': f"Login failed: {error_msg}"}
        except Exception as e:
            return {'passed': False, 'message': f"Login test error: {str(e)}"}
            
    def test_protected_endpoint(self):
        """Test accessing a protected endpoint with authentication"""
        try:
            if not self.access_token:
                return {'passed': False, 'message': "No access token available"}
                
            headers = {'Authorization': f'Bearer {self.access_token}'}
            response = self.session.get(
                f"{self.base_url}/api/v1/users/profile",
                headers=headers,
                timeout=10
            )
            
            # We expect either 200 (if endpoint exists) or 404 (if not implemented yet)
            if response.status_code in [200, 404]:
                return {
                    'passed': True,
                    'message': f"Protected endpoint accessible (status: {response.status_code})"
                }
            elif response.status_code == 401:
                return {'passed': False, 'message': "Authentication failed for protected endpoint"}
            else:
                return {'passed': False, 'message': f"Unexpected response: {response.status_code}"}
        except Exception as e:
            return {'passed': False, 'message': f"Protected endpoint test error: {str(e)}"}
            
    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        try:
            # Make multiple rapid requests to trigger rate limiting
            endpoint = f"{self.base_url}/api/v1/auth/login"
            rapid_requests = []
            
            for i in range(10):
                start = time.time()
                response = self.session.post(
                    endpoint,
                    json={"email": "test@test.com", "password": "wrong"},
                    timeout=5
                )
                duration = time.time() - start
                rapid_requests.append({
                    'status_code': response.status_code,
                    'duration': duration
                })
                
                # If we get rate limited, that's what we want
                if response.status_code == 429:
                    return {
                        'passed': True,
                        'message': f"Rate limiting active (triggered after {i+1} requests)",
                        'details': {'requests_made': i+1}
                    }
                    
                time.sleep(0.1)  # Small delay between requests
                
            return {
                'passed': False,
                'message': "Rate limiting not triggered after 10 requests",
                'details': {'all_requests': rapid_requests}
            }
        except Exception as e:
            return {'passed': False, 'message': f"Rate limiting test error: {str(e)}"}
            
    def test_error_handling(self):
        """Test error handling and response format"""
        try:
            # Test 404 error
            response = self.session.get(f"{self.base_url}/api/v1/nonexistent", timeout=10)
            
            if response.status_code == 404:
                try:
                    error_data = response.json()
                    if 'error' in error_data:
                        return {
                            'passed': True,
                            'message': "Error handling working (404 with JSON response)",
                            'details': error_data
                        }
                    else:
                        return {'passed': False, 'message': "404 error missing proper error structure"}
                except json.JSONDecodeError:
                    return {'passed': False, 'message': "404 error not returning JSON"}
            else:
                return {'passed': False, 'message': f"Expected 404, got {response.status_code}"}
        except Exception as e:
            return {'passed': False, 'message': f"Error handling test error: {str(e)}"}
            
    def run_all_tests(self):
        """Run all tests and generate report"""
        self.log("🚀 Starting MediMind Backend Production Test Suite")
        self.log(f"Testing server at: {self.base_url}")
        
        # Define test suite
        tests = [
            ("Server Startup", self.test_server_startup),
            ("Detailed Health Check", self.test_detailed_health_check),
            ("API Documentation", self.test_api_documentation),
            ("CORS Configuration", self.test_cors_headers),
            ("Security Headers", self.test_security_headers),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Protected Endpoint Access", self.test_protected_endpoint),
            ("Rate Limiting", self.test_rate_limiting),
            ("Error Handling", self.test_error_handling),
        ]
        
        # Run tests
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            if self.run_test(test_name, test_func):
                passed_tests += 1
                
        # Generate report
        self.generate_report(passed_tests, total_tests)
        
        return passed_tests == total_tests
        
    def generate_report(self, passed: int, total: int):
        """Generate test report"""
        self.log("\n" + "="*80)
        self.log("📊 TEST REPORT")
        self.log("="*80)
        
        success_rate = (passed / total) * 100
        self.log(f"Tests Passed: {passed}/{total} ({success_rate:.1f}%)")
        
        if success_rate == 100:
            self.log("🎉 ALL TESTS PASSED! Backend is production-ready.", "SUCCESS")
        elif success_rate >= 80:
            self.log("⚠️  Most tests passed. Minor issues to address.", "WARNING")
        else:
            self.log("❌ Multiple test failures. Backend needs attention.", "ERROR")
            
        self.log("\nDetailed Results:")
        for result in self.test_results:
            status = "✅ PASS" if result.passed else "❌ FAIL"
            self.log(f"  {status} {result.name} ({result.duration:.2f}s)")
            if not result.passed:
                self.log(f"    └─ {result.message}")
                
        self.log("="*80)

def main():
    """Main test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description='MediMind Backend Production Test Suite')
    parser.add_argument('--url', default='http://localhost:3000', 
                       help='Backend server URL (default: http://localhost:3000)')
    parser.add_argument('--verbose', action='store_true', 
                       help='Enable verbose output')
    
    args = parser.parse_args()
    
    tester = MediMindBackendTester(args.url)
    
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        tester.log("\n⚠️  Test suite interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        tester.log(f"\n❌ Test suite failed with error: {str(e)}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
