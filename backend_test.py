#!/usr/bin/env python3
"""
Backend API Testing for Nutrition App
Tests all CRUD operations and authentication
"""
import requests
import sys
from datetime import datetime
import json

class NutritionAPITester:
    def __init__(self, base_url="https://order-nutrition.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASSED"
        else:
            status = "❌ FAILED"
        
        result = f"{status} - {name}"
        if details:
            result += f" | {details}"
        
        print(result)
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (expected {expected_status})"
                if response.text:
                    try:
                        error_data = response.json()
                        if 'detail' in error_data:
                            details += f" | Error: {error_data['detail']}"
                    except:
                        details += f" | Response: {response.text[:100]}"

            return self.log_test(name, success, details), response.json() if success else {}

        except requests.exceptions.RequestException as e:
            return self.log_test(name, False, f"Request Error: {str(e)}"), {}
        except Exception as e:
            return self.log_test(name, False, f"Error: {str(e)}"), {}

    def test_admin_authentication(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test valid login
        success, response = self.run_test(
            "Admin Login - Valid Credentials",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@nutrition.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_test("Token Retrieved", True, f"Email: {response.get('email', 'N/A')}")
        else:
            return False

        # Test token verification
        success, _ = self.run_test(
            "Token Verification",
            "GET", 
            "auth/verify",
            200
        )
        
        # Test invalid login
        self.run_test(
            "Admin Login - Invalid Credentials",
            "POST",
            "auth/login", 
            401,
            data={"email": "admin@nutrition.com", "password": "wrong"}
        )
        
        return True

    def test_public_lookup(self):
        """Test public order lookup"""
        print("\n🔍 Testing Public Order Lookup...")
        
        # Test valid order lookup
        success, response = self.run_test(
            "Order Lookup - Valid Order (ORD-2024-001/Sharma)",
            "POST",
            "lookup",
            200,
            data={"order_number": "ORD-2024-001", "last_name": "Sharma"}
        )
        
        if success:
            required_fields = ['customer_name', 'order_number', 'product_name', 'ingredients_text', 'nutrition']
            missing_fields = [f for f in required_fields if f not in response]
            if missing_fields:
                self.log_test("Lookup Response Format", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Lookup Response Format", True, f"Product: {response.get('product_name', 'N/A')}")

        # Test second valid order
        self.run_test(
            "Order Lookup - Valid Order (ORD-2024-002/Patel)",
            "POST",
            "lookup",
            200,
            data={"order_number": "ORD-2024-002", "last_name": "Patel"}
        )
        
        # Test order not found
        self.run_test(
            "Order Lookup - Order Not Found",
            "POST", 
            "lookup",
            404,
            data={"order_number": "ORD-2024-999", "last_name": "Unknown"}
        )

    def test_sku_management(self):
        """Test SKU CRUD operations"""
        if not self.token:
            self.log_test("SKU Management", False, "No auth token available")
            return

        print("\n📦 Testing SKU Management...")
        
        # Test get all SKUs
        success, response = self.run_test(
            "Get All SKUs",
            "GET",
            "skus",
            200
        )
        
        if success:
            sku_count = len(response)
            self.log_test("SKU Count Check", sku_count >= 10, f"Found {sku_count} SKUs (expected ≥10)")
            
            if response:
                first_sku = response[0]
                self.existing_sku_id = first_sku.get('id')
                required_fields = ['id', 'sku_code', 'name', 'ingredients_text', 'nutrition']
                missing_fields = [f for f in required_fields if f not in first_sku]
                if missing_fields:
                    self.log_test("SKU Data Structure", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("SKU Data Structure", True, f"Sample SKU: {first_sku.get('name', 'N/A')}")

        # Test create new SKU
        new_sku_data = {
            "sku_code": f"TEST-{datetime.now().strftime('%H%M%S')}",
            "name": "Test Flour",
            "ingredients_text": "Test Flour (100%)",
            "nutrition": {
                "energy_kcal": 300.0,
                "protein_g": 10.0,
                "carbs_g": 60.0,
                "sugars_g": 0.5,
                "fibre_g": 5.0,
                "fat_g": 2.0,
                "sat_fat_g": 0.5,
                "trans_fat_g": 0.0,
                "sodium_mg": 1.0
            }
        }
        
        success, response = self.run_test(
            "Create New SKU",
            "POST",
            "skus",
            200,
            data=new_sku_data
        )
        
        if success:
            self.test_sku_id = response.get('id')
            
            # Test update SKU
            updated_sku_data = new_sku_data.copy()
            updated_sku_data['name'] = "Updated Test Flour"
            
            self.run_test(
                "Update SKU",
                "PUT",
                f"skus/{self.test_sku_id}",
                200,
                data=updated_sku_data
            )
            
            # Test delete SKU
            self.run_test(
                "Delete SKU",
                "DELETE",
                f"skus/{self.test_sku_id}",
                200
            )

    def test_supplement_management(self):
        """Test Supplement CRUD operations"""
        if not self.token:
            self.log_test("Supplement Management", False, "No auth token available")
            return

        print("\n🌿 Testing Supplement Management...")
        
        # Test get all supplements
        success, response = self.run_test(
            "Get All Supplements",
            "GET",
            "supplements",
            200
        )
        
        if success:
            supp_count = len(response)
            self.log_test("Supplement Count Check", supp_count >= 3, f"Found {supp_count} supplements (expected ≥3)")

        # Test create new supplement
        new_supp_data = {
            "name": f"Test Supplement {datetime.now().strftime('%H%M%S')}",
            "ingredients_text": "Test Supplement Powder (2%)",
            "nutrition": {
                "energy_kcal": 15.0,
                "protein_g": 1.0,
                "carbs_g": 2.0,
                "sugars_g": 0.0,
                "fibre_g": 0.5,
                "fat_g": 0.5,
                "sat_fat_g": 0.1,
                "trans_fat_g": 0.0,
                "sodium_mg": 0.5
            }
        }
        
        success, response = self.run_test(
            "Create New Supplement",
            "POST",
            "supplements",
            200,
            data=new_supp_data
        )
        
        if success:
            self.test_supp_id = response.get('id')
            
            # Test update supplement
            updated_supp_data = new_supp_data.copy()
            updated_supp_data['name'] = "Updated Test Supplement"
            
            self.run_test(
                "Update Supplement",
                "PUT",
                f"supplements/{self.test_supp_id}",
                200,
                data=updated_supp_data
            )
            
            # Test delete supplement
            self.run_test(
                "Delete Supplement",
                "DELETE",
                f"supplements/{self.test_supp_id}",
                200
            )

    def test_order_management(self):
        """Test Order CRUD operations"""
        if not self.token:
            self.log_test("Order Management", False, "No auth token available")
            return

        print("\n📋 Testing Order Management...")
        
        # Test get all orders
        success, response = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        
        if success:
            order_count = len(response)
            self.log_test("Order Count Check", order_count >= 2, f"Found {order_count} orders (expected ≥2)")
            
            if response:
                first_order = response[0]
                self.existing_order_id = first_order.get('id')

        # Get SKUs and supplements for creating test order
        sku_success, sku_response = self.run_test(
            "Get SKUs for Order Test",
            "GET",
            "skus",
            200
        )
        
        supp_success, supp_response = self.run_test(
            "Get Supplements for Order Test",
            "GET", 
            "supplements",
            200
        )
        
        if sku_success and supp_success and sku_response and supp_response:
            # Test create SKU-based order
            new_order_data = {
                "order_number": f"ORD-TEST-{datetime.now().strftime('%H%M%S')}",
                "customer_first_name": "Test",
                "customer_last_name": "Customer",
                "base_sku_id": sku_response[0]['id'],
                "supplement_ids": [supp_response[0]['id']],
                "is_custom": False
            }
            
            success, response = self.run_test(
                "Create SKU-based Order",
                "POST",
                "orders",
                200,
                data=new_order_data
            )
            
            if success:
                self.test_order_id = response.get('id')
                
                # Verify nutrition calculation
                final_nutrition = response.get('final_nutrition', {})
                if final_nutrition.get('energy_kcal', 0) > 0:
                    self.log_test("Nutrition Calculation", True, f"Energy: {final_nutrition['energy_kcal']} kcal")
                else:
                    self.log_test("Nutrition Calculation", False, "No energy value calculated")
                
                # Test create custom order
                custom_order_data = {
                    "order_number": f"ORD-CUSTOM-{datetime.now().strftime('%H%M%S')}",
                    "customer_first_name": "Custom",
                    "customer_last_name": "Customer", 
                    "is_custom": True,
                    "custom_ingredients_text": "Custom Blend: Wheat (70%), Ragi (30%)",
                    "custom_nutrition": {
                        "energy_kcal": 340.0,
                        "protein_g": 11.0,
                        "carbs_g": 70.0,
                        "sugars_g": 0.2,
                        "fibre_g": 11.8,
                        "fat_g": 1.5,
                        "sat_fat_g": 0.25,
                        "trans_fat_g": 0.0,
                        "sodium_mg": 6.5
                    }
                }
                
                success2, response2 = self.run_test(
                    "Create Custom Order",
                    "POST",
                    "orders",
                    200,
                    data=custom_order_data
                )
                
                if success2:
                    self.test_custom_order_id = response2.get('id')
                
                # Test update order
                updated_order_data = new_order_data.copy()
                updated_order_data['customer_first_name'] = "Updated Test"
                
                self.run_test(
                    "Update Order",
                    "PUT",
                    f"orders/{self.test_order_id}",
                    200,
                    data=updated_order_data
                )
                
                # Test delete orders
                self.run_test(
                    "Delete Test Order",
                    "DELETE",
                    f"orders/{self.test_order_id}",
                    200
                )
                
                if hasattr(self, 'test_custom_order_id'):
                    self.run_test(
                        "Delete Custom Order",
                        "DELETE",
                        f"orders/{self.test_custom_order_id}",
                        200
                    )

    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting Nutrition App Backend API Tests")
        print("=" * 50)
        
        # Initialize test data storage
        self.existing_sku_id = None
        self.existing_order_id = None
        self.test_sku_id = None
        self.test_supp_id = None
        self.test_order_id = None
        self.test_custom_order_id = None
        
        # Run all test suites
        if self.test_admin_authentication():
            self.test_public_lookup()
            self.test_sku_management()
            self.test_supplement_management()
            self.test_order_management()
        
        # Print final results
        print("\n" + "=" * 50)
        print(f"📊 TEST RESULTS: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return 0
        else:
            print("⚠️  Some tests failed. See details above.")
            return 1

def main():
    tester = NutritionAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())