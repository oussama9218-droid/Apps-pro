#!/usr/bin/env python3
"""
Backend API Testing for Pilotage Micro MVP
Tests all backend endpoints for the French micro-entrepreneur management app
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://compliance-dash-3.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class PilotageAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.access_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def set_auth_token(self, token: str):
        """Set authentication token for subsequent requests"""
        self.access_token = token
        self.headers["Authorization"] = f"Bearer {token}"
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, use_auth: bool = True) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers if use_auth else {"Content-Type": "application/json"}
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            else:
                return False, f"Unsupported method: {method}", 0
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("🔐 Testing Authentication System...")
        
        # Test user registration
        user_data = {
            "email": "marie.dupont@freelance.fr",
            "password": "SecurePass123!",
            "first_name": "Marie",
            "last_name": "Dupont"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/register", user_data, use_auth=False)
        
        if success and "access_token" in response:
            self.set_auth_token(response["access_token"])
            self.user_id = response["user"]["id"]
            self.log_test("User Registration", True, f"User created with ID: {self.user_id}")
            return True
        else:
            self.log_test("User Registration", False, f"Status: {status_code}", response)
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        login_data = {
            "email": "marie.dupont@freelance.fr",
            "password": "SecurePass123!"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", login_data, use_auth=False)
        
        if success and "access_token" in response:
            # Update token for subsequent tests
            self.set_auth_token(response["access_token"])
            self.log_test("User Login", True, "Login successful, token received")
            return True
        else:
            self.log_test("User Login", False, f"Status: {status_code}", response)
            return False
    
    def test_token_verification(self):
        """Test JWT token verification"""
        success, response, status_code = self.make_request("GET", "/auth/me")
        
        if success and "email" in response:
            self.log_test("Token Verification", True, f"User authenticated: {response['email']}")
            return True
        else:
            self.log_test("Token Verification", False, f"Status: {status_code}", response)
            return False
    
    def test_profile_creation(self):
        """Test user profile creation"""
        print("👤 Testing User Profile Management...")
        
        profile_data = {
            "activity_type": "BIC",
            "urssaf_periodicity": "monthly",
            "vat_regime": "franchise",
            "micro_threshold": 77700.0,
            "vat_threshold": 36800.0,
            "previous_year_turnover": 25000.0
        }
        
        success, response, status_code = self.make_request("POST", "/profile", profile_data)
        
        if success and "id" in response:
            self.log_test("Profile Creation", True, f"Profile created with activity: {response['activity_type']}")
            return True
        else:
            self.log_test("Profile Creation", False, f"Status: {status_code}", response)
            return False
    
    def test_profile_retrieval(self):
        """Test profile retrieval"""
        success, response, status_code = self.make_request("GET", "/profile")
        
        if success and "activity_type" in response:
            self.log_test("Profile Retrieval", True, f"Retrieved profile: {response['activity_type']} - {response['vat_regime']}")
            return True
        else:
            self.log_test("Profile Retrieval", False, f"Status: {status_code}", response)
            return False
    
    def test_profile_update(self):
        """Test profile update"""
        updated_data = {
            "activity_type": "BNC",
            "urssaf_periodicity": "quarterly",
            "vat_regime": "simplified",
            "micro_threshold": 77700.0,
            "vat_threshold": 36800.0,
            "previous_year_turnover": 30000.0
        }
        
        success, response, status_code = self.make_request("PUT", "/profile", updated_data)
        
        if success and response.get("activity_type") == "BNC":
            self.log_test("Profile Update", True, f"Profile updated to BNC with simplified VAT")
            return True
        else:
            self.log_test("Profile Update", False, f"Status: {status_code}", response)
            return False
    
    def test_invoice_creation(self):
        """Test invoice creation"""
        print("🧾 Testing Invoice Management...")
        
        invoice_data = {
            "client_name": "Entreprise Innovante SARL",
            "client_email": "contact@entreprise-innovante.fr",
            "client_address": "123 Avenue des Champs-Élysées, 75008 Paris",
            "amount_ht": 2500.0,
            "description": "Développement site web e-commerce - Phase 1",
            "due_date": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        success, response, status_code = self.make_request("POST", "/invoices", invoice_data)
        
        if success and "invoice_number" in response:
            self.invoice_id = response["id"]
            self.log_test("Invoice Creation", True, f"Invoice {response['invoice_number']} created for €{response['amount_ttc']}")
            return True
        else:
            self.log_test("Invoice Creation", False, f"Status: {status_code}", response)
            return False
    
    def test_invoice_listing(self):
        """Test invoice listing"""
        success, response, status_code = self.make_request("GET", "/invoices")
        
        if success and isinstance(response, list):
            invoice_count = len(response)
            self.log_test("Invoice Listing", True, f"Retrieved {invoice_count} invoices")
            return True
        else:
            self.log_test("Invoice Listing", False, f"Status: {status_code}", response)
            return False
    
    def test_invoice_status_update(self):
        """Test invoice status update"""
        if not hasattr(self, 'invoice_id'):
            self.log_test("Invoice Status Update", False, "No invoice ID available from creation test")
            return False
        
        # Test updating to 'sent' status
        success, response, status_code = self.make_request("PUT", f"/invoices/{self.invoice_id}/status?status=sent")
        
        if success:
            self.log_test("Invoice Status Update (Sent)", True, "Invoice marked as sent")
            
            # Test updating to 'paid' status
            success2, response2, status_code2 = self.make_request("PUT", f"/invoices/{self.invoice_id}/status?status=paid")
            
            if success2:
                self.log_test("Invoice Status Update (Paid)", True, "Invoice marked as paid")
                return True
            else:
                self.log_test("Invoice Status Update (Paid)", False, f"Status: {status_code2}", response2)
                return False
        else:
            self.log_test("Invoice Status Update (Sent)", False, f"Status: {status_code}", response)
            return False
    
    def test_dashboard_data(self):
        """Test dashboard data retrieval"""
        print("📊 Testing Dashboard API...")
        
        success, response, status_code = self.make_request("GET", "/dashboard")
        
        if success and "current_revenue" in response:
            revenue = response["current_revenue"]
            micro_percent = response["micro_threshold_percent"]
            vat_percent = response["vat_threshold_percent"]
            
            self.log_test("Dashboard Data", True, 
                         f"Revenue: €{revenue}, Micro threshold: {micro_percent:.1f}%, VAT threshold: {vat_percent:.1f}%")
            return True
        else:
            self.log_test("Dashboard Data", False, f"Status: {status_code}", response)
            return False
    
    def test_mock_obligations_init(self):
        """Test mock obligations initialization"""
        print("📋 Testing Mock Obligations System...")
        
        success, response, status_code = self.make_request("POST", "/mock/init-obligations")
        
        if success and "obligations créées" in response.get("message", ""):
            self.log_test("Mock Obligations Init", True, response["message"])
            return True
        else:
            self.log_test("Mock Obligations Init", False, f"Status: {status_code}", response)
            return False
    
    def test_dashboard_with_obligations(self):
        """Test dashboard after obligations are created"""
        success, response, status_code = self.make_request("GET", "/dashboard")
        
        if success and "next_obligations" in response:
            obligations_count = len(response["next_obligations"])
            transactions_count = len(response.get("recent_transactions", []))
            
            self.log_test("Dashboard with Obligations", True, 
                         f"Found {obligations_count} obligations and {transactions_count} mock transactions")
            return True
        else:
            self.log_test("Dashboard with Obligations", False, f"Status: {status_code}", response)
            return False
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("⚠️ Testing Error Handling...")
        
        # Test invalid login
        invalid_login = {
            "email": "nonexistent@test.fr",
            "password": "wrongpassword"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", invalid_login, use_auth=False)
        
        if not success and status_code == 400:
            self.log_test("Invalid Login Error", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Invalid Login Error", False, f"Expected 400 error, got {status_code}")
        
        # Test accessing protected endpoint without token
        temp_headers = self.headers.copy()
        self.headers = {"Content-Type": "application/json"}  # Remove auth header
        
        success, response, status_code = self.make_request("GET", "/profile", use_auth=False)
        
        if not success and status_code == 403:
            self.log_test("Unauthorized Access Error", True, "Correctly rejected request without token")
        else:
            self.log_test("Unauthorized Access Error", False, f"Expected 403 error, got {status_code}")
        
        # Restore headers
        self.headers = temp_headers
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Pilotage Micro Backend API Tests")
        print("=" * 60)
        
        # Authentication tests
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
        
        if not self.test_user_login():
            print("❌ Login failed - stopping tests")
            return False
        
        if not self.test_token_verification():
            print("❌ Token verification failed - stopping tests")
            return False
        
        # Profile tests
        if not self.test_profile_creation():
            print("❌ Profile creation failed - continuing with other tests")
        
        self.test_profile_retrieval()
        self.test_profile_update()
        
        # Invoice tests
        self.test_invoice_creation()
        self.test_invoice_listing()
        self.test_invoice_status_update()
        
        # Dashboard and obligations tests
        self.test_dashboard_data()
        self.test_mock_obligations_init()
        self.test_dashboard_with_obligations()
        
        # Error handling tests
        self.test_error_handling()
        
        # Summary
        print("=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = PilotageAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)