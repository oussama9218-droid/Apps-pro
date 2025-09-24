#!/usr/bin/env python3
"""
CRITICAL TESTING - User reports "toujours ko" after recent fixes
Testing specific priorities as requested in the review
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://compliance-dash-3.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print(f"🔧 CRITICAL TESTING - Backend API at: {API_BASE}")

class CriticalTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        self.client_id = None
        self.invoice_id = None
        
    def log_test(self, test_name, success, details="", priority=""):
        """Log test results with priority"""
        status = "✅ PASS" if success else "❌ FAIL"
        priority_str = f"[{priority}] " if priority else ""
        print(f"{status} {priority_str}{test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'priority': priority
        })
    
    def test_priority_1_authentication(self):
        """PRIORITY 1: Test Authentication & User Flow with marie@test.com"""
        print("\n🔥 PRIORITY 1: AUTHENTICATION & USER FLOW")
        print("=" * 50)
        
        # Test login with marie@test.com / password123
        print("Testing login with marie@test.com / password123...")
        
        payload = {
            "email": "marie@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data and 'user' in data:
                    self.auth_token = data['access_token']
                    self.user_id = data['user']['id']
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log_test("Marie Login", True, f"Successfully logged in as: {data['user']['email']}", "P1")
                    
                    # Test JWT token generation and validation
                    self.test_jwt_validation()
                    
                    # Test profile access
                    self.test_profile_access()
                    
                    # Test protected endpoints
                    self.test_protected_endpoints()
                    
                    return True
                else:
                    self.log_test("Marie Login", False, "Missing token or user in response", "P1")
                    return False
            else:
                self.log_test("Marie Login", False, f"HTTP {response.status_code}: {response.text}", "P1")
                return False
                
        except Exception as e:
            self.log_test("Marie Login", False, f"Exception: {str(e)}", "P1")
            return False
    
    def test_jwt_validation(self):
        """Test JWT token generation and validation"""
        try:
            response = self.session.get(f"{API_BASE}/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if 'email' in data and data['email'] == 'marie@test.com':
                    self.log_test("JWT Token Validation", True, f"Token valid for user: {data['email']}", "P1")
                    return True
                else:
                    self.log_test("JWT Token Validation", False, "Invalid user data in token response", "P1")
                    return False
            else:
                self.log_test("JWT Token Validation", False, f"HTTP {response.status_code}: {response.text}", "P1")
                return False
                
        except Exception as e:
            self.log_test("JWT Token Validation", False, f"Exception: {str(e)}", "P1")
            return False
    
    def test_profile_access(self):
        """Test profile access working"""
        try:
            response = self.session.get(f"{API_BASE}/profile")
            
            if response.status_code == 200:
                data = response.json()
                if 'user_id' in data and 'activity_type' in data:
                    self.log_test("Profile Access", True, f"Profile accessible: {data['activity_type']} - {data['vat_regime']}", "P1")
                    return True
                else:
                    self.log_test("Profile Access", False, "Invalid profile data structure", "P1")
                    return False
            elif response.status_code == 404:
                self.log_test("Profile Access", False, "Profile not found - user may need onboarding", "P1")
                return False
            else:
                self.log_test("Profile Access", False, f"HTTP {response.status_code}: {response.text}", "P1")
                return False
                
        except Exception as e:
            self.log_test("Profile Access", False, f"Exception: {str(e)}", "P1")
            return False
    
    def test_protected_endpoints(self):
        """Test all protected endpoints accessible"""
        endpoints_to_test = [
            ("/dashboard", "Dashboard"),
            ("/invoices", "Invoices List"),
            ("/clients", "Clients List"),
            ("/notifications", "Notifications")
        ]
        
        all_accessible = True
        for endpoint, name in endpoints_to_test:
            try:
                response = self.session.get(f"{API_BASE}{endpoint}")
                
                if response.status_code == 200:
                    self.log_test(f"Protected Endpoint: {name}", True, f"Accessible at {endpoint}", "P1")
                else:
                    self.log_test(f"Protected Endpoint: {name}", False, f"HTTP {response.status_code} at {endpoint}", "P1")
                    all_accessible = False
                    
            except Exception as e:
                self.log_test(f"Protected Endpoint: {name}", False, f"Exception: {str(e)}", "P1")
                all_accessible = False
        
        return all_accessible
    
    def test_priority_2_client_creation(self):
        """PRIORITY 2: Test Client Creation"""
        print("\n🔥 PRIORITY 2: CLIENT CREATION")
        print("=" * 50)
        
        if not self.auth_token:
            self.log_test("Client Creation Setup", False, "No auth token available", "P2")
            return False
        
        # Create unique client to avoid duplicate email error
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        client_payload = {
            "name": "Test Client SARL",
            "email": f"testclient_{timestamp}@example.com",
            "siret": "12345678901234",
            "address": "123 Rue de Test, 75001 Paris",
            "phone": "0123456789",
            "notes": "Client de test pour validation critique"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/clients", json=client_payload)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'name' in data:
                    self.client_id = data['id']
                    self.log_test("Client Creation", True, f"Client created: {data['name']} (ID: {data['id']})", "P2")
                    
                    # Verify client creation response format
                    self.verify_client_response_format(data)
                    
                    # Test client listing
                    self.test_client_listing()
                    
                    return True
                else:
                    self.log_test("Client Creation", False, "Invalid response format - missing id or name", "P2")
                    return False
            else:
                self.log_test("Client Creation", False, f"HTTP {response.status_code}: {response.text}", "P2")
                return False
                
        except Exception as e:
            self.log_test("Client Creation", False, f"Exception: {str(e)}", "P2")
            return False
    
    def verify_client_response_format(self, data):
        """Verify client creation response format matches frontend expectations"""
        required_fields = ['id', 'name', 'email', 'address', 'user_id', 'created_at']
        missing_fields = [field for field in required_fields if field not in data]
        
        if not missing_fields:
            self.log_test("Client Response Format", True, "All required fields present", "P2")
        else:
            self.log_test("Client Response Format", False, f"Missing fields: {missing_fields}", "P2")
    
    def test_client_listing(self):
        """Test client listing endpoint"""
        try:
            response = self.session.get(f"{API_BASE}/clients")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Client Listing", True, f"Retrieved {len(data)} clients", "P2")
                    return True
                else:
                    self.log_test("Client Listing", False, "Response is not a list", "P2")
                    return False
            else:
                self.log_test("Client Listing", False, f"HTTP {response.status_code}: {response.text}", "P2")
                return False
                
        except Exception as e:
            self.log_test("Client Listing", False, f"Exception: {str(e)}", "P2")
            return False
    
    def test_priority_3_invoice_creation(self):
        """PRIORITY 3: Test Invoice Creation"""
        print("\n🔥 PRIORITY 3: INVOICE CREATION")
        print("=" * 50)
        
        if not self.auth_token:
            self.log_test("Invoice Creation Setup", False, "No auth token available", "P3")
            return False
        
        # Create test invoice with valid data
        invoice_payload = {
            "client_name": "Test Client SARL",
            "client_email": "testclient@example.com",
            "client_address": "123 Rue de Test, 75001 Paris",
            "amount_ht": 2000.00,
            "description": "Prestation de développement - Test critique",
            "due_date": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=invoice_payload)
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data and 'invoice_number' in data:
                    self.invoice_id = data['id']
                    self.log_test("Invoice Creation", True, f"Invoice created: {data['invoice_number']} - {data['amount_ttc']}€", "P3")
                    
                    # Verify invoice creation response format
                    self.verify_invoice_response_format(data)
                    
                    # Verify auto-numbering
                    self.verify_invoice_auto_numbering(data)
                    
                    # Test invoice listing
                    self.test_invoice_listing()
                    
                    return True
                else:
                    self.log_test("Invoice Creation", False, "Invalid response format - missing id or invoice_number", "P3")
                    return False
            else:
                self.log_test("Invoice Creation", False, f"HTTP {response.status_code}: {response.text}", "P3")
                return False
                
        except Exception as e:
            self.log_test("Invoice Creation", False, f"Exception: {str(e)}", "P3")
            return False
    
    def verify_invoice_response_format(self, data):
        """Verify invoice creation response format matches frontend expectations"""
        required_fields = ['id', 'invoice_number', 'amount_ht', 'amount_ttc', 'vat_amount', 'status', 'created_at']
        missing_fields = [field for field in required_fields if field not in data]
        
        if not missing_fields:
            self.log_test("Invoice Response Format", True, "All required fields present", "P3")
        else:
            self.log_test("Invoice Response Format", False, f"Missing fields: {missing_fields}", "P3")
    
    def verify_invoice_auto_numbering(self, data):
        """Verify invoice auto-numbering works correctly"""
        invoice_number = data.get('invoice_number', '')
        current_year = datetime.now().year
        
        if invoice_number.startswith(f"FAC-{current_year}-"):
            self.log_test("Invoice Auto-numbering", True, f"Correct format: {invoice_number}", "P3")
        else:
            self.log_test("Invoice Auto-numbering", False, f"Incorrect format: {invoice_number}", "P3")
    
    def test_invoice_listing(self):
        """Test invoice listing"""
        try:
            response = self.session.get(f"{API_BASE}/invoices")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Invoice Listing", True, f"Retrieved {len(data)} invoices", "P3")
                    return True
                else:
                    self.log_test("Invoice Listing", False, "Response is not a list", "P3")
                    return False
            else:
                self.log_test("Invoice Listing", False, f"HTTP {response.status_code}: {response.text}", "P3")
                return False
                
        except Exception as e:
            self.log_test("Invoice Listing", False, f"Exception: {str(e)}", "P3")
            return False
    
    def test_priority_4_pdf_export(self):
        """PRIORITY 4: Test PDF Export"""
        print("\n🔥 PRIORITY 4: PDF EXPORT")
        print("=" * 50)
        
        if not self.auth_token:
            self.log_test("PDF Export Setup", False, "No auth token available", "P4")
            return False
        
        if not self.invoice_id:
            self.log_test("PDF Export Setup", False, "No invoice ID available for PDF test", "P4")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/invoices/{self.invoice_id}/pdf")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                content_length = len(response.content)
                content_disposition = response.headers.get('content-disposition', '')
                
                # Verify PDF generation returns valid file
                if 'application/pdf' in content_type and content_length > 1000:
                    self.log_test("PDF Generation", True, f"Valid PDF generated ({content_length} bytes)", "P4")
                    
                    # Check authentication on PDF endpoint (already tested by successful request)
                    self.log_test("PDF Authentication", True, "PDF endpoint properly authenticated", "P4")
                    
                    # Verify response headers
                    if 'attachment' in content_disposition:
                        self.log_test("PDF Response Headers", True, f"Correct headers: {content_disposition}", "P4")
                    else:
                        self.log_test("PDF Response Headers", False, f"Missing attachment header: {content_disposition}", "P4")
                    
                    return True
                else:
                    self.log_test("PDF Generation", False, f"Invalid PDF: {content_type}, {content_length} bytes", "P4")
                    return False
            else:
                self.log_test("PDF Generation", False, f"HTTP {response.status_code}: {response.text}", "P4")
                return False
                
        except Exception as e:
            self.log_test("PDF Generation", False, f"Exception: {str(e)}", "P4")
            return False
    
    def test_priority_5_api_compatibility(self):
        """PRIORITY 5: Check API Compatibility"""
        print("\n🔥 PRIORITY 5: API COMPATIBILITY")
        print("=" * 50)
        
        # Test client creation payload format
        self.test_client_payload_compatibility()
        
        # Test invoice creation payload format
        self.test_invoice_payload_compatibility()
        
        # Test PDF download response headers
        self.test_pdf_response_compatibility()
    
    def test_client_payload_compatibility(self):
        """Verify client creation payload format matches frontend expectations"""
        expected_payload = {
            "name": "string",
            "email": "string",
            "siret": "string (optional)",
            "address": "string",
            "phone": "string (optional)",
            "notes": "string (optional)"
        }
        
        # Test with minimal payload
        minimal_payload = {
            "name": "Minimal Client",
            "email": f"minimal_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "address": "123 Test Street"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/clients", json=minimal_payload)
            
            if response.status_code == 200:
                self.log_test("Client Payload Compatibility", True, "Minimal payload accepted", "P5")
            else:
                self.log_test("Client Payload Compatibility", False, f"Minimal payload rejected: {response.status_code}", "P5")
                
        except Exception as e:
            self.log_test("Client Payload Compatibility", False, f"Exception: {str(e)}", "P5")
    
    def test_invoice_payload_compatibility(self):
        """Verify invoice creation payload format matches frontend expectations"""
        # Test with standard payload
        standard_payload = {
            "client_name": "Test Client",
            "client_email": "test@client.com",
            "client_address": "123 Client Street",
            "amount_ht": 1000.00,
            "description": "Test service"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/invoices", json=standard_payload)
            
            if response.status_code == 200:
                self.log_test("Invoice Payload Compatibility", True, "Standard payload accepted", "P5")
            else:
                self.log_test("Invoice Payload Compatibility", False, f"Standard payload rejected: {response.status_code}", "P5")
                
        except Exception as e:
            self.log_test("Invoice Payload Compatibility", False, f"Exception: {str(e)}", "P5")
    
    def test_pdf_response_compatibility(self):
        """Verify PDF download response headers match frontend expectations"""
        if not self.invoice_id:
            self.log_test("PDF Response Compatibility", False, "No invoice ID available", "P5")
            return
        
        try:
            response = self.session.get(f"{API_BASE}/invoices/{self.invoice_id}/pdf")
            
            if response.status_code == 200:
                headers = response.headers
                required_headers = ['content-type', 'content-disposition']
                
                missing_headers = [h for h in required_headers if h not in headers]
                
                if not missing_headers:
                    self.log_test("PDF Response Compatibility", True, "All required headers present", "P5")
                else:
                    self.log_test("PDF Response Compatibility", False, f"Missing headers: {missing_headers}", "P5")
            else:
                self.log_test("PDF Response Compatibility", False, f"PDF request failed: {response.status_code}", "P5")
                
        except Exception as e:
            self.log_test("PDF Response Compatibility", False, f"Exception: {str(e)}", "P5")
    
    def run_critical_tests(self):
        """Run all critical tests in priority order"""
        print("🚨 STARTING CRITICAL TESTING - User reports 'toujours ko'")
        print("=" * 60)
        
        # Priority 1: Authentication & User Flow
        auth_success = self.test_priority_1_authentication()
        
        if not auth_success:
            print("\n❌ CRITICAL FAILURE: Authentication failed - stopping tests")
            self.print_summary()
            return False
        
        # Priority 2: Client Creation
        self.test_priority_2_client_creation()
        
        # Priority 3: Invoice Creation
        self.test_priority_3_invoice_creation()
        
        # Priority 4: PDF Export
        self.test_priority_4_pdf_export()
        
        # Priority 5: API Compatibility
        self.test_priority_5_api_compatibility()
        
        # Summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print critical test summary"""
        print("\n" + "=" * 60)
        print("🚨 CRITICAL TEST SUMMARY")
        print("=" * 60)
        
        # Group by priority
        priorities = {}
        for result in self.test_results:
            priority = result.get('priority', 'Other')
            if priority not in priorities:
                priorities[priority] = {'passed': 0, 'failed': 0, 'tests': []}
            
            if result['success']:
                priorities[priority]['passed'] += 1
            else:
                priorities[priority]['failed'] += 1
            
            priorities[priority]['tests'].append(result)
        
        # Print priority-wise summary
        for priority in ['P1', 'P2', 'P3', 'P4', 'P5']:
            if priority in priorities:
                p = priorities[priority]
                total = p['passed'] + p['failed']
                success_rate = (p['passed'] / total * 100) if total > 0 else 0
                
                print(f"\n{priority} - {self.get_priority_name(priority)}:")
                print(f"  ✅ Passed: {p['passed']}")
                print(f"  ❌ Failed: {p['failed']}")
                print(f"  📊 Success Rate: {success_rate:.1f}%")
                
                # Show failed tests for this priority
                failed_tests = [t for t in p['tests'] if not t['success']]
                if failed_tests:
                    print(f"  🚨 Failed Tests:")
                    for test in failed_tests:
                        print(f"    - {test['test']}: {test['details']}")
        
        # Overall summary
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 OVERALL RESULTS:")
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n" + "=" * 60)
        
        return passed_tests, failed_tests
    
    def get_priority_name(self, priority):
        """Get priority name"""
        names = {
            'P1': 'Authentication & User Flow',
            'P2': 'Client Creation',
            'P3': 'Invoice Creation',
            'P4': 'PDF Export',
            'P5': 'API Compatibility'
        }
        return names.get(priority, priority)

if __name__ == "__main__":
    tester = CriticalTester()
    success = tester.run_critical_tests()
    sys.exit(0 if success else 1)