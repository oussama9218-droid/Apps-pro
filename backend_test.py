#!/usr/bin/env python3
"""
Backend API Testing for Pilotage Micro MVP - Phase 2
Tests all backend endpoints including new Phase 2 features:
- Client Management System
- PDF Invoice Export  
- Automated Reminder System
- Notification System
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://compliance-dash-3.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}
TEST_USER_EMAIL = "marie@test.com"
TEST_USER_PASSWORD = "password123"

class PilotageAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.access_token = None
        self.user_id = None
        self.test_results = []
        self.test_client_id = None
        self.test_invoice_id = None
        self.test_notification_id = None
        
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
    
    def test_user_authentication(self):
        """Test user authentication with existing account"""
        print("🔐 Testing Authentication System...")
        
        # Use existing user account
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", login_data, use_auth=False)
        
        if success and "access_token" in response:
            self.set_auth_token(response["access_token"])
            self.user_id = response["user"]["id"]
            self.log_test("User Login", True, f"Authenticated user: {response['user']['email']}")
            return True
        else:
            self.log_test("User Login", False, f"Status: {status_code}", response)
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
    
    # ===== PHASE 2 TESTS =====
    
    def test_client_management(self):
        """Test Phase 2 - Client Management System"""
        print("👥 Testing Client Management System...")
        
        # Test 1: Create client
        client_data = {
            "name": "Entreprise Innovante SARL",
            "email": "contact@entreprise-innovante.fr",
            "siret": "12345678901234",
            "address": "123 Avenue des Champs-Élysées, 75008 Paris",
            "phone": "0123456789",
            "notes": "Client test pour validation Phase 2"
        }
        
        success, response, status_code = self.make_request("POST", "/clients", client_data)
        
        if success and "id" in response:
            self.test_client_id = response["id"]
            self.log_test("Client Creation", True, f"Client created: {response['name']}")
        else:
            self.log_test("Client Creation", False, f"Status: {status_code}", response)
            return False
        
        # Test 2: Get all clients
        success, response, status_code = self.make_request("GET", "/clients")
        
        if success and isinstance(response, list) and len(response) > 0:
            self.log_test("Client List", True, f"Retrieved {len(response)} clients")
        else:
            self.log_test("Client List", False, f"Status: {status_code}", response)
        
        # Test 3: Get specific client
        success, response, status_code = self.make_request("GET", f"/clients/{self.test_client_id}")
        
        if success and response.get("id") == self.test_client_id:
            self.log_test("Client Retrieval", True, f"Retrieved client: {response.get('name')}")
        else:
            self.log_test("Client Retrieval", False, f"Status: {status_code}", response)
        
        # Test 4: Update client
        update_data = {
            "name": "Entreprise Innovante SARL - Modifiée",
            "email": "contact@entreprise-innovante.fr",
            "siret": "12345678901234",
            "address": "456 Rue de Rivoli, 75001 Paris",
            "phone": "0123456789",
            "notes": "Client test modifié"
        }
        
        success, response, status_code = self.make_request("PUT", f"/clients/{self.test_client_id}", update_data)
        
        if success and response.get("name") == update_data["name"]:
            self.log_test("Client Update", True, "Client updated successfully")
        else:
            self.log_test("Client Update", False, f"Status: {status_code}", response)
        
        # Test 5: Duplicate email validation
        duplicate_client = {
            "name": "Autre Entreprise",
            "email": "contact@entreprise-innovante.fr",  # Same email
            "address": "789 Rue Autre, 75009 Paris"
        }
        
        success, response, status_code = self.make_request("POST", "/clients", duplicate_client)
        
        if not success and status_code == 400:
            self.log_test("Duplicate Email Validation", True, "Correctly rejected duplicate email")
        else:
            self.log_test("Duplicate Email Validation", False, f"Should have rejected duplicate. Status: {status_code}")
        
        return True
    
    def test_pdf_invoice_export(self):
        """Test Phase 2 - PDF Invoice Export"""
        print("📄 Testing PDF Invoice Export...")
        
        # Create invoice with client for PDF generation
        invoice_data = {
            "client_id": self.test_client_id,
            "client_name": "Entreprise Innovante SARL",
            "client_email": "contact@entreprise-innovante.fr",
            "client_address": "123 Avenue des Champs-Élysées, 75008 Paris",
            "amount_ht": 2500.0,
            "description": "Développement application web - Phase 2",
            "due_date": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        success, response, status_code = self.make_request("POST", "/invoices", invoice_data)
        
        if success and "id" in response:
            self.test_invoice_id = response["id"]
            self.log_test("Invoice Creation for PDF", True, f"Invoice {response['invoice_number']} created")
        else:
            self.log_test("Invoice Creation for PDF", False, f"Status: {status_code}", response)
            return False
        
        # Test PDF generation
        try:
            url = f"{self.base_url}/invoices/{self.test_invoice_id}/pdf"
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                
                if 'application/pdf' in content_type and content_length > 1000:
                    self.log_test("PDF Generation", True, f"PDF generated successfully ({content_length} bytes)")
                else:
                    self.log_test("PDF Generation", False, f"Invalid PDF. Content-Type: {content_type}, Size: {content_length}")
            else:
                self.log_test("PDF Generation", False, f"HTTP {response.status_code}: {response.text}")
        
        except Exception as e:
            self.log_test("PDF Generation", False, f"Exception: {str(e)}")
        
        return True
    
    def test_reminder_system(self):
        """Test Phase 2 - Automated Reminder System"""
        print("🔔 Testing Reminder System...")
        
        if not self.test_invoice_id:
            self.log_test("Reminder System Setup", False, "No test invoice available")
            return False
        
        # Test 1: Send manual reminder
        success, response, status_code = self.make_request("POST", f"/invoices/{self.test_invoice_id}/reminders")
        
        if success and "reminder_type" in response:
            self.log_test("Manual Reminder", True, f"Reminder sent: {response.get('reminder_type')}")
        else:
            self.log_test("Manual Reminder", False, f"Status: {status_code}", response)
        
        # Test 2: Get reminder history
        success, response, status_code = self.make_request("GET", f"/invoices/{self.test_invoice_id}/reminders")
        
        if success and isinstance(response, list):
            self.log_test("Reminder History", True, f"Retrieved {len(response)} reminders")
        else:
            self.log_test("Reminder History", False, f"Status: {status_code}", response)
        
        # Test 3: Send second reminder (should escalate to firm)
        success, response, status_code = self.make_request("POST", f"/invoices/{self.test_invoice_id}/reminders")
        
        if success and response.get("reminder_type") == "firm":
            self.log_test("Reminder Escalation", True, "Second reminder correctly escalated to 'firm'")
        else:
            self.log_test("Reminder Escalation", False, f"Expected 'firm', got: {response}")
        
        # Test 4: Auto-reminder processing
        success, response, status_code = self.make_request("POST", "/mock/auto-reminders")
        
        if success and "message" in response:
            self.log_test("Auto Reminders", True, f"Auto-reminders processed: {response.get('message')}")
        else:
            self.log_test("Auto Reminders", False, f"Status: {status_code}", response)
        
        return True
    
    def test_notification_system(self):
        """Test Phase 2 - Notification System"""
        print("🔔 Testing Notification System...")
        
        # Test 1: Schedule mock notifications
        success, response, status_code = self.make_request("POST", "/mock/schedule-notifications")
        
        if success and "notifications" in response.get("message", ""):
            self.log_test("Schedule Notifications", True, f"Notifications scheduled: {response.get('message')}")
        else:
            self.log_test("Schedule Notifications", False, f"Status: {status_code}", response)
        
        # Test 2: Get notifications list
        success, response, status_code = self.make_request("GET", "/notifications")
        
        if success and isinstance(response, list):
            self.log_test("Get Notifications", True, f"Retrieved {len(response)} notifications")
            if len(response) > 0:
                self.test_notification_id = response[0]["id"]
        else:
            self.log_test("Get Notifications", False, f"Status: {status_code}", response)
        
        # Test 3: Mark notification as read
        if self.test_notification_id:
            success, response, status_code = self.make_request("POST", f"/notifications/{self.test_notification_id}/read")
            
            if success and "message" in response:
                self.log_test("Mark Notification Read", True, "Notification marked as read")
            else:
                self.log_test("Mark Notification Read", False, f"Status: {status_code}", response)
        else:
            self.log_test("Mark Notification Read", False, "No notification ID available")
        
        return True
    
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
        
        # Test 1: Invalid client ID
        success, response, status_code = self.make_request("GET", "/clients/invalid-id")
        
        if not success and status_code == 404:
            self.log_test("Invalid Client ID", True, "Correctly returned 404 for invalid client")
        else:
            self.log_test("Invalid Client ID", False, f"Expected 404, got {status_code}")
        
        # Test 2: Invalid invoice ID for PDF
        success, response, status_code = self.make_request("GET", "/invoices/invalid-id/pdf")
        
        if not success and status_code == 404:
            self.log_test("Invalid Invoice PDF", True, "Correctly returned 404 for invalid invoice PDF")
        else:
            self.log_test("Invalid Invoice PDF", False, f"Expected 404, got {status_code}")
        
        # Test 3: Invalid login
        invalid_login = {
            "email": "nonexistent@test.fr",
            "password": "wrongpassword"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", invalid_login, use_auth=False)
        
        if not success and status_code == 400:
            self.log_test("Invalid Login Error", True, "Correctly rejected invalid credentials")
        else:
            self.log_test("Invalid Login Error", False, f"Expected 400 error, got {status_code}")
        
        # Test 4: Accessing protected endpoint without token
        temp_headers = self.headers.copy()
        self.headers = {"Content-Type": "application/json"}  # Remove auth header
        
        success, response, status_code = self.make_request("GET", "/profile", use_auth=False)
        
        if not success and status_code == 403:
            self.log_test("Unauthorized Access Error", True, "Correctly rejected request without token")
        else:
            self.log_test("Unauthorized Access Error", False, f"Expected 403 error, got {status_code}")
        
        # Restore headers
        self.headers = temp_headers
        
        # Test 5: Delete client with invoices (should fail)
        if self.test_client_id:
            success, response, status_code = self.make_request("DELETE", f"/clients/{self.test_client_id}")
            
            if not success and status_code == 400:
                self.log_test("Delete Client with Invoices", True, "Correctly prevented deletion of client with invoices")
            else:
                self.log_test("Delete Client with Invoices", False, f"Should have prevented deletion. Status: {status_code}")
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        
        # Note: We don't clean up the client since it has invoices linked to it
        # This is expected behavior - clients with invoices cannot be deleted
        if self.test_client_id:
            print(f"⚠️ Test client {self.test_client_id} left in database (has linked invoices)")
        
        if self.test_invoice_id:
            print(f"⚠️ Test invoice {self.test_invoice_id} left in database")
    
    def run_all_tests(self):
        """Run all backend tests including Phase 2 features"""
        print("🚀 Starting Pilotage Micro Backend API Tests - Phase 2")
        print("=" * 70)
        
        # Authentication test
        if not self.test_user_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        if not self.test_token_verification():
            print("❌ Token verification failed - stopping tests")
            return False
        
        # Profile tests (existing functionality)
        self.test_profile_retrieval()
        
        # ===== PHASE 2 FEATURE TESTS =====
        print("\n🎯 PHASE 2 FEATURE TESTING")
        print("=" * 50)
        
        # Client Management System
        self.test_client_management()
        
        # PDF Invoice Export
        self.test_pdf_invoice_export()
        
        # Reminder System
        self.test_reminder_system()
        
        # Notification System
        self.test_notification_system()
        
        # ===== EXISTING FUNCTIONALITY TESTS =====
        print("\n📊 EXISTING FUNCTIONALITY VERIFICATION")
        print("=" * 50)
        
        # Invoice tests (verify existing functionality still works)
        self.test_invoice_listing()
        if hasattr(self, 'test_invoice_id') and self.test_invoice_id:
            self.test_invoice_status_update()
        
        # Dashboard and obligations tests
        self.test_dashboard_data()
        self.test_mock_obligations_init()
        self.test_dashboard_with_obligations()
        
        # Error handling tests
        self.test_error_handling()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("=" * 70)
        print("📋 COMPREHENSIVE TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Phase 2 specific summary
        phase2_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in 
                       ["Client", "PDF", "Reminder", "Notification"])]
        phase2_passed = sum(1 for result in phase2_tests if result["success"])
        phase2_total = len(phase2_tests)
        
        print(f"\n🎯 PHASE 2 FEATURES:")
        print(f"Phase 2 Tests: {phase2_total}")
        print(f"Phase 2 Passed: {phase2_passed}")
        print(f"Phase 2 Success Rate: {(phase2_passed/phase2_total)*100:.1f}%" if phase2_total > 0 else "No Phase 2 tests")
        
        if total - passed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed == total

if __name__ == "__main__":
    tester = PilotageAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)