#!/usr/bin/env python3
"""
AgriDirect Backend API Test Suite
Tests all backend endpoints with comprehensive scenarios
"""
import requests
import json
import sys
from typing import Dict, Any

# Base URL from environment
BASE_URL = "https://agri-trade-ap.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS: {name}")
        if details:
            print(f"   {details}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{name}: {details}")
        print(f"❌ FAIL: {name}")
        print(f"   {details}")

def test_auth():
    """Test authentication endpoints"""
    print("\n" + "="*80)
    print("TESTING AUTH ENDPOINTS")
    print("="*80)
    
    # Test 1: Register new farmer
    session_farmer = requests.Session()
    resp = session_farmer.post(f"{BASE_URL}/auth/register", json={
        "name": "Test Farmer Krishna",
        "email": "testfarmer@agridirect.in",
        "password": "test123",
        "role": "farmer",
        "phone": "9876543299",
        "village": "Testville",
        "mandal": "Testmandal"
    })
    log_test(
        "Register new farmer",
        resp.status_code == 200,
        f"Status: {resp.status_code}, Response: {resp.text[:200]}"
    )
    
    # Test 2: Register new buyer
    session_buyer = requests.Session()
    resp = session_buyer.post(f"{BASE_URL}/auth/register", json={
        "name": "Test Buyer Ramesh",
        "email": "testbuyer@agridirect.in",
        "password": "test123",
        "role": "buyer",
        "phone": "9876543288"
    })
    log_test(
        "Register new buyer",
        resp.status_code == 200,
        f"Status: {resp.status_code}, Response: {resp.text[:200]}"
    )
    
    # Test 3: Login with demo farmer account
    session_ravi = requests.Session()
    resp = session_ravi.post(f"{BASE_URL}/auth/login", json={
        "email": "farmer@agridirect.in",
        "password": "farmer123"
    })
    log_test(
        "Login demo farmer (Ravi Kumar)",
        resp.status_code == 200 and "user" in resp.json(),
        f"Status: {resp.status_code}, User: {resp.json().get('user', {}).get('name', 'N/A')}"
    )
    
    # Test 4: Login with demo buyer account
    session_suresh = requests.Session()
    resp = session_suresh.post(f"{BASE_URL}/auth/login", json={
        "email": "buyer@agridirect.in",
        "password": "buyer123"
    })
    log_test(
        "Login demo buyer (Suresh Traders)",
        resp.status_code == 200 and "user" in resp.json(),
        f"Status: {resp.status_code}, User: {resp.json().get('user', {}).get('name', 'N/A')}"
    )
    
    # Test 5: Login with demo admin account
    session_admin = requests.Session()
    resp = session_admin.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@agridirect.in",
        "password": "admin123"
    })
    log_test(
        "Login demo admin",
        resp.status_code == 200 and resp.json().get('user', {}).get('role') == 'admin',
        f"Status: {resp.status_code}, Role: {resp.json().get('user', {}).get('role', 'N/A')}"
    )
    
    # Test 6: GET /auth/me returns user
    resp = session_ravi.get(f"{BASE_URL}/auth/me")
    log_test(
        "GET /auth/me returns authenticated user",
        resp.status_code == 200 and resp.json().get('user', {}).get('email') == 'farmer@agridirect.in',
        f"Status: {resp.status_code}, Email: {resp.json().get('user', {}).get('email', 'N/A')}"
    )
    
    # Test 7: Update profile
    resp = session_ravi.put(f"{BASE_URL}/auth/profile", json={
        "phone": "9999999999",
        "village": "Updated Village"
    })
    log_test(
        "PUT /auth/profile updates fields",
        resp.status_code == 200 and resp.json().get('user', {}).get('phone') == '9999999999',
        f"Status: {resp.status_code}, Phone: {resp.json().get('user', {}).get('phone', 'N/A')}"
    )
    
    # Test 8: Logout
    resp = session_ravi.post(f"{BASE_URL}/auth/logout")
    log_test(
        "POST /auth/logout clears session",
        resp.status_code == 200,
        f"Status: {resp.status_code}"
    )
    
    # Test 9: After logout, /auth/me should return 401
    resp = session_ravi.get(f"{BASE_URL}/auth/me")
    log_test(
        "After logout, /auth/me returns 401",
        resp.status_code == 401,
        f"Status: {resp.status_code}"
    )
    
    # Return sessions for further tests
    return {
        "farmer": session_farmer,
        "buyer": session_buyer,
        "ravi": session_ravi,  # logged out
        "suresh": session_suresh,
        "admin": session_admin
    }

def test_role_separation(sessions: Dict[str, requests.Session]):
    """Test role-based access control"""
    print("\n" + "="*80)
    print("TESTING ROLE SEPARATION")
    print("="*80)
    
    # Re-login Ravi for these tests
    session_ravi = requests.Session()
    session_ravi.post(f"{BASE_URL}/auth/login", json={
        "email": "farmer@agridirect.in",
        "password": "farmer123"
    })
    
    # Login Lakshmi (second farmer)
    session_lakshmi = requests.Session()
    session_lakshmi.post(f"{BASE_URL}/auth/login", json={
        "email": "lakshmi@agridirect.in",
        "password": "farmer123"
    })
    
    # Test 1: Only farmer can POST /produce
    resp = session_ravi.post(f"{BASE_URL}/produce", json={
        "name": "Test Paddy",
        "category": "Paddy",
        "price": 2000,
        "quantity": 100,
        "unit": "quintal"
    })
    log_test(
        "Farmer can POST /produce",
        resp.status_code == 200,
        f"Status: {resp.status_code}, Produce ID: {resp.json().get('id', 'N/A')}"
    )
    produce_id = resp.json().get('id') if resp.status_code == 200 else None
    
    # Test 2: Buyer cannot POST /produce
    resp = sessions["suresh"].post(f"{BASE_URL}/produce", json={
        "name": "Test Item",
        "category": "Paddy",
        "price": 2000
    })
    log_test(
        "Buyer cannot POST /produce (403)",
        resp.status_code == 403,
        f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
    )
    
    # Test 3: Only buyer can POST /orders
    # First get a produce item
    resp = sessions["suresh"].get(f"{BASE_URL}/produce")
    produce_items = resp.json() if resp.status_code == 200 else []
    if produce_items:
        test_produce = produce_items[0]
        resp = sessions["suresh"].post(f"{BASE_URL}/orders", json={
            "produce_id": test_produce['id'],
            "quantity": 1
        })
        log_test(
            "Buyer can POST /orders",
            resp.status_code == 200,
            f"Status: {resp.status_code}, Order ID: {resp.json().get('id', 'N/A')}"
        )
    
    # Test 4: Farmer cannot POST /orders
    if produce_items:
        resp = session_ravi.post(f"{BASE_URL}/orders", json={
            "produce_id": produce_items[0]['id'],
            "quantity": 1
        })
        log_test(
            "Farmer cannot POST /orders (403)",
            resp.status_code == 403,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )
    
    # Test 5: Only buyer can access /buyer/wishlist
    resp = sessions["suresh"].get(f"{BASE_URL}/buyer/wishlist")
    log_test(
        "Buyer can GET /buyer/wishlist",
        resp.status_code == 200,
        f"Status: {resp.status_code}"
    )
    
    # Test 6: Farmer cannot access /buyer/wishlist
    resp = session_ravi.get(f"{BASE_URL}/buyer/wishlist")
    log_test(
        "Farmer cannot GET /buyer/wishlist (403)",
        resp.status_code == 403,
        f"Status: {resp.status_code}"
    )
    
    # Test 7: Only admin can access /admin/stats
    resp = sessions["admin"].get(f"{BASE_URL}/admin/stats")
    log_test(
        "Admin can GET /admin/stats",
        resp.status_code == 200,
        f"Status: {resp.status_code}, Stats: {json.dumps(resp.json())[:100]}"
    )
    
    # Test 8: Non-admin cannot access /admin/stats
    resp = session_ravi.get(f"{BASE_URL}/admin/stats")
    log_test(
        "Farmer cannot GET /admin/stats (403)",
        resp.status_code == 403,
        f"Status: {resp.status_code}"
    )
    
    resp = sessions["suresh"].get(f"{BASE_URL}/admin/stats")
    log_test(
        "Buyer cannot GET /admin/stats (403)",
        resp.status_code == 403,
        f"Status: {resp.status_code}"
    )
    
    return {"ravi": session_ravi, "lakshmi": session_lakshmi, "produce_id": produce_id}

def test_produce_ownership(farmer_sessions: Dict[str, Any]):
    """Test produce ownership enforcement"""
    print("\n" + "="*80)
    print("TESTING PRODUCE OWNERSHIP")
    print("="*80)
    
    session_ravi = farmer_sessions["ravi"]
    session_lakshmi = farmer_sessions["lakshmi"]
    
    # Test 1: Ravi creates produce
    resp = session_ravi.post(f"{BASE_URL}/produce", json={
        "name": "Ravi's Special Paddy",
        "category": "Paddy",
        "price": 2200,
        "quantity": 50,
        "unit": "quintal"
    })
    log_test(
        "Farmer A creates produce",
        resp.status_code == 200,
        f"Status: {resp.status_code}, ID: {resp.json().get('id', 'N/A')}"
    )
    ravi_produce_id = resp.json().get('id') if resp.status_code == 200 else None
    
    if ravi_produce_id:
        # Test 2: Lakshmi tries to update Ravi's produce
        resp = session_lakshmi.put(f"{BASE_URL}/produce/{ravi_produce_id}", json={
            "price": 1000
        })
        log_test(
            "Farmer B cannot PUT Farmer A's produce (403)",
            resp.status_code == 403,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )
        
        # Test 3: Lakshmi tries to delete Ravi's produce
        resp = session_lakshmi.delete(f"{BASE_URL}/produce/{ravi_produce_id}")
        log_test(
            "Farmer B cannot DELETE Farmer A's produce (403)",
            resp.status_code == 403,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )
        
        # Test 4: Ravi can update his own produce
        resp = session_ravi.put(f"{BASE_URL}/produce/{ravi_produce_id}", json={
            "price": 2300
        })
        log_test(
            "Owner can PUT their own produce",
            resp.status_code == 200 and resp.json().get('price') == 2300,
            f"Status: {resp.status_code}, New price: {resp.json().get('price', 'N/A')}"
        )
        
        # Test 5: Ravi can delete his own produce
        resp = session_ravi.delete(f"{BASE_URL}/produce/{ravi_produce_id}")
        log_test(
            "Owner can DELETE their own produce",
            resp.status_code == 200,
            f"Status: {resp.status_code}"
        )

def test_public_browse():
    """Test public produce browsing and filters"""
    print("\n" + "="*80)
    print("TESTING PUBLIC BROWSE & FILTERS")
    print("="*80)
    
    # Test 1: GET /produce returns seeded items
    resp = requests.get(f"{BASE_URL}/produce")
    log_test(
        "GET /produce returns seeded items",
        resp.status_code == 200 and len(resp.json()) > 0,
        f"Status: {resp.status_code}, Count: {len(resp.json()) if resp.status_code == 200 else 0}"
    )
    
    # Test 2: Filter by search=paddy
    resp = requests.get(f"{BASE_URL}/produce?search=paddy")
    items = resp.json() if resp.status_code == 200 else []
    has_paddy = any('paddy' in item.get('name', '').lower() or 'paddy' in item.get('category', '').lower() for item in items)
    log_test(
        "Filter ?search=paddy works",
        resp.status_code == 200 and has_paddy,
        f"Status: {resp.status_code}, Found {len(items)} items with 'paddy'"
    )
    
    # Test 3: Filter by category=Banana
    resp = requests.get(f"{BASE_URL}/produce?category=Banana")
    items = resp.json() if resp.status_code == 200 else []
    all_banana = all(item.get('category') == 'Banana' for item in items)
    log_test(
        "Filter ?category=Banana works",
        resp.status_code == 200 and all_banana and len(items) > 0,
        f"Status: {resp.status_code}, Found {len(items)} banana items"
    )
    
    # Test 4: Filter by mandal=Bhimavaram
    resp = requests.get(f"{BASE_URL}/produce?mandal=Bhimavaram")
    items = resp.json() if resp.status_code == 200 else []
    all_bhimavaram = all(item.get('mandal') == 'Bhimavaram' for item in items)
    log_test(
        "Filter ?mandal=Bhimavaram works",
        resp.status_code == 200 and all_bhimavaram and len(items) > 0,
        f"Status: {resp.status_code}, Found {len(items)} items from Bhimavaram"
    )
    
    # Test 5: Filter by price range
    resp = requests.get(f"{BASE_URL}/produce?min_price=20&max_price=30")
    items = resp.json() if resp.status_code == 200 else []
    in_range = all(20 <= item.get('price', 0) <= 30 for item in items)
    log_test(
        "Filter ?min_price=20&max_price=30 works",
        resp.status_code == 200 and in_range,
        f"Status: {resp.status_code}, Found {len(items)} items in price range"
    )
    
    # Test 6: Sort by price_asc
    resp = requests.get(f"{BASE_URL}/produce?sort=price_asc")
    items = resp.json() if resp.status_code == 200 else []
    is_sorted_asc = items == sorted(items, key=lambda x: x.get('price', 0))
    log_test(
        "Sort ?sort=price_asc works",
        resp.status_code == 200 and is_sorted_asc,
        f"Status: {resp.status_code}, Items sorted ascending"
    )
    
    # Test 7: Sort by price_desc
    resp = requests.get(f"{BASE_URL}/produce?sort=price_desc")
    items = resp.json() if resp.status_code == 200 else []
    is_sorted_desc = items == sorted(items, key=lambda x: x.get('price', 0), reverse=True)
    log_test(
        "Sort ?sort=price_desc works",
        resp.status_code == 200 and is_sorted_desc,
        f"Status: {resp.status_code}, Items sorted descending"
    )
    
    # Test 8: GET /mandals returns distinct mandals
    resp = requests.get(f"{BASE_URL}/mandals")
    log_test(
        "GET /mandals returns distinct mandals",
        resp.status_code == 200 and len(resp.json()) > 0,
        f"Status: {resp.status_code}, Mandals: {resp.json()[:5] if resp.status_code == 200 else []}"
    )
    
    # Test 9: GET /produce/:id returns one item
    resp = requests.get(f"{BASE_URL}/produce")
    if resp.status_code == 200 and len(resp.json()) > 0:
        test_id = resp.json()[0]['id']
        resp = requests.get(f"{BASE_URL}/produce/{test_id}")
        log_test(
            "GET /produce/:id returns single item",
            resp.status_code == 200 and resp.json().get('id') == test_id,
            f"Status: {resp.status_code}, ID: {resp.json().get('id', 'N/A')}"
        )
    
    # Test 10: Invalid ID returns 404
    resp = requests.get(f"{BASE_URL}/produce/invalid-id-12345")
    log_test(
        "GET /produce/:id with invalid ID returns 404",
        resp.status_code == 404,
        f"Status: {resp.status_code}"
    )

def test_orders_and_stock():
    """Test order placement and stock management"""
    print("\n" + "="*80)
    print("TESTING ORDERS & STOCK MANAGEMENT")
    print("="*80)
    
    # Login buyer
    session_buyer = requests.Session()
    session_buyer.post(f"{BASE_URL}/auth/login", json={
        "email": "buyer@agridirect.in",
        "password": "buyer123"
    })
    
    # Get a produce item with stock
    resp = requests.get(f"{BASE_URL}/produce")
    produce_items = resp.json() if resp.status_code == 200 else []
    test_produce = None
    for item in produce_items:
        if item.get('quantity', 0) > 5:  # Find item with sufficient stock
            test_produce = item
            break
    
    if not test_produce:
        print("⚠️  No produce with sufficient stock found for testing")
        return
    
    initial_qty = test_produce['quantity']
    produce_id = test_produce['id']
    
    # Test 1: Place order within stock
    order_qty = 2
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": order_qty
    })
    log_test(
        "Buyer places order within stock",
        resp.status_code == 200,
        f"Status: {resp.status_code}, Order ID: {resp.json().get('id', 'N/A')}"
    )
    
    # Test 2: Verify stock decreased
    resp = requests.get(f"{BASE_URL}/produce/{produce_id}")
    new_qty = resp.json().get('quantity', 0) if resp.status_code == 200 else initial_qty
    expected_qty = initial_qty - order_qty
    log_test(
        "Stock decreases after order",
        new_qty == expected_qty,
        f"Initial: {initial_qty}, Ordered: {order_qty}, New: {new_qty}, Expected: {expected_qty}"
    )
    
    # Test 3: Order more than available stock
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": new_qty + 100
    })
    log_test(
        "Ordering more than stock is rejected (400)",
        resp.status_code == 400,
        f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
    )
    
    # Test 4: Create produce with small stock and deplete it
    session_farmer = requests.Session()
    session_farmer.post(f"{BASE_URL}/auth/login", json={
        "email": "farmer@agridirect.in",
        "password": "farmer123"
    })
    
    resp = session_farmer.post(f"{BASE_URL}/produce", json={
        "name": "Limited Stock Item",
        "category": "Vegetables",
        "price": 50,
        "quantity": 3,
        "unit": "kg"
    })
    
    if resp.status_code == 200:
        limited_produce_id = resp.json()['id']
        
        # Order all stock
        resp = session_buyer.post(f"{BASE_URL}/orders", json={
            "produce_id": limited_produce_id,
            "quantity": 3
        })
        log_test(
            "Order that depletes stock succeeds",
            resp.status_code == 200,
            f"Status: {resp.status_code}"
        )
        
        # Test 5: Verify status changed to unavailable
        resp = requests.get(f"{BASE_URL}/produce/{limited_produce_id}")
        status = resp.json().get('status', '') if resp.status_code == 200 else ''
        qty = resp.json().get('quantity', -1) if resp.status_code == 200 else -1
        log_test(
            "Produce marked unavailable when stock reaches 0",
            status == 'unavailable' and qty == 0,
            f"Status: {status}, Quantity: {qty}"
        )
        
        # Test 6: Cannot order unavailable produce
        resp = session_buyer.post(f"{BASE_URL}/orders", json={
            "produce_id": limited_produce_id,
            "quantity": 1
        })
        log_test(
            "Cannot order unavailable produce (400)",
            resp.status_code == 400,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )

def test_order_status_workflow():
    """Test order status transitions"""
    print("\n" + "="*80)
    print("TESTING ORDER STATUS WORKFLOW")
    print("="*80)
    
    # Login farmer and buyer
    session_farmer = requests.Session()
    session_farmer.post(f"{BASE_URL}/auth/login", json={
        "email": "farmer@agridirect.in",
        "password": "farmer123"
    })
    
    session_lakshmi = requests.Session()
    session_lakshmi.post(f"{BASE_URL}/auth/login", json={
        "email": "lakshmi@agridirect.in",
        "password": "farmer123"
    })
    
    session_buyer = requests.Session()
    session_buyer.post(f"{BASE_URL}/auth/login", json={
        "email": "buyer@agridirect.in",
        "password": "buyer123"
    })
    
    # Create produce and place order
    resp = session_farmer.post(f"{BASE_URL}/produce", json={
        "name": "Workflow Test Produce",
        "category": "Paddy",
        "price": 2000,
        "quantity": 100,
        "unit": "quintal"
    })
    
    if resp.status_code != 200:
        print("⚠️  Failed to create test produce")
        return
    
    produce_id = resp.json()['id']
    
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": 5
    })
    
    if resp.status_code != 200:
        print("⚠️  Failed to create test order")
        return
    
    order_id = resp.json()['id']
    
    # Test 1: Valid transition pending -> accepted
    resp = session_farmer.put(f"{BASE_URL}/orders/{order_id}/status", json={
        "status": "accepted"
    })
    log_test(
        "Valid transition: pending -> accepted",
        resp.status_code == 200 and resp.json().get('status') == 'accepted',
        f"Status: {resp.status_code}, Order status: {resp.json().get('status', 'N/A')}"
    )
    
    # Test 2: Valid transition accepted -> processing
    resp = session_farmer.put(f"{BASE_URL}/orders/{order_id}/status", json={
        "status": "processing"
    })
    log_test(
        "Valid transition: accepted -> processing",
        resp.status_code == 200 and resp.json().get('status') == 'processing',
        f"Status: {resp.status_code}, Order status: {resp.json().get('status', 'N/A')}"
    )
    
    # Test 3: Valid transition processing -> ready
    resp = session_farmer.put(f"{BASE_URL}/orders/{order_id}/status", json={
        "status": "ready"
    })
    log_test(
        "Valid transition: processing -> ready",
        resp.status_code == 200 and resp.json().get('status') == 'ready',
        f"Status: {resp.status_code}, Order status: {resp.json().get('status', 'N/A')}"
    )
    
    # Test 4: Valid transition ready -> completed
    resp = session_farmer.put(f"{BASE_URL}/orders/{order_id}/status", json={
        "status": "completed"
    })
    log_test(
        "Valid transition: ready -> completed",
        resp.status_code == 200 and resp.json().get('status') == 'completed',
        f"Status: {resp.status_code}, Order status: {resp.json().get('status', 'N/A')}"
    )
    
    # Test 5: Invalid transition (create new order for this)
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": 3
    })
    order_id2 = resp.json()['id'] if resp.status_code == 200 else None
    
    if order_id2:
        # Try invalid jump: pending -> completed
        resp = session_farmer.put(f"{BASE_URL}/orders/{order_id2}/status", json={
            "status": "completed"
        })
        log_test(
            "Invalid transition: pending -> completed rejected (400)",
            resp.status_code == 400,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )
        
        # Test 6: Farmer can reject pending order
        resp = session_farmer.put(f"{BASE_URL}/orders/{order_id2}/status", json={
            "status": "rejected"
        })
        log_test(
            "Farmer can reject pending order",
            resp.status_code == 200 and resp.json().get('status') == 'rejected',
            f"Status: {resp.status_code}, Order status: {resp.json().get('status', 'N/A')}"
        )
    
    # Test 7: Farmer cannot update another farmer's order
    # Create order from Lakshmi's produce
    resp = session_lakshmi.post(f"{BASE_URL}/produce", json={
        "name": "Lakshmi's Produce",
        "category": "Coconut",
        "price": 25,
        "quantity": 100,
        "unit": "piece"
    })
    
    if resp.status_code == 200:
        lakshmi_produce_id = resp.json()['id']
        
        resp = session_buyer.post(f"{BASE_URL}/orders", json={
            "produce_id": lakshmi_produce_id,
            "quantity": 5
        })
        
        if resp.status_code == 200:
            lakshmi_order_id = resp.json()['id']
            
            # Ravi tries to update Lakshmi's order
            resp = session_farmer.put(f"{BASE_URL}/orders/{lakshmi_order_id}/status", json={
                "status": "accepted"
            })
            log_test(
                "Farmer cannot update another farmer's order (403)",
                resp.status_code == 403,
                f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
            )

def test_buyer_cancel():
    """Test buyer cancellation rules"""
    print("\n" + "="*80)
    print("TESTING BUYER CANCEL")
    print("="*80)
    
    # Login farmer and buyer
    session_farmer = requests.Session()
    session_farmer.post(f"{BASE_URL}/auth/login", json={
        "email": "farmer@agridirect.in",
        "password": "farmer123"
    })
    
    session_buyer = requests.Session()
    session_buyer.post(f"{BASE_URL}/auth/login", json={
        "email": "buyer@agridirect.in",
        "password": "buyer123"
    })
    
    # Create produce
    resp = session_farmer.post(f"{BASE_URL}/produce", json={
        "name": "Cancel Test Produce",
        "category": "Vegetables",
        "price": 30,
        "quantity": 50,
        "unit": "kg"
    })
    
    if resp.status_code != 200:
        print("⚠️  Failed to create test produce")
        return
    
    produce_id = resp.json()['id']
    
    # Test 1: Buyer can cancel pending order
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": 2
    })
    order_id1 = resp.json()['id'] if resp.status_code == 200 else None
    
    if order_id1:
        resp = session_buyer.put(f"{BASE_URL}/orders/{order_id1}/status", json={
            "status": "cancelled"
        })
        log_test(
            "Buyer can cancel pending order",
            resp.status_code == 200 and resp.json().get('status') == 'cancelled',
            f"Status: {resp.status_code}, Order status: {resp.json().get('status', 'N/A')}"
        )
    
    # Test 2: Buyer can cancel accepted order
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": 2
    })
    order_id2 = resp.json()['id'] if resp.status_code == 200 else None
    
    if order_id2:
        # Farmer accepts
        session_farmer.put(f"{BASE_URL}/orders/{order_id2}/status", json={
            "status": "accepted"
        })
        
        # Buyer cancels
        resp = session_buyer.put(f"{BASE_URL}/orders/{order_id2}/status", json={
            "status": "cancelled"
        })
        log_test(
            "Buyer can cancel accepted order",
            resp.status_code == 200 and resp.json().get('status') == 'cancelled',
            f"Status: {resp.status_code}, Order status: {resp.json().get('status', 'N/A')}"
        )
    
    # Test 3: Buyer cannot cancel completed order
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": 2
    })
    order_id3 = resp.json()['id'] if resp.status_code == 200 else None
    
    if order_id3:
        # Move to completed
        session_farmer.put(f"{BASE_URL}/orders/{order_id3}/status", json={"status": "accepted"})
        session_farmer.put(f"{BASE_URL}/orders/{order_id3}/status", json={"status": "processing"})
        session_farmer.put(f"{BASE_URL}/orders/{order_id3}/status", json={"status": "ready"})
        session_farmer.put(f"{BASE_URL}/orders/{order_id3}/status", json={"status": "completed"})
        
        # Try to cancel
        resp = session_buyer.put(f"{BASE_URL}/orders/{order_id3}/status", json={
            "status": "cancelled"
        })
        log_test(
            "Buyer cannot cancel completed order (400)",
            resp.status_code == 400,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )
    
    # Test 4: Buyer cannot set status other than cancelled
    resp = session_buyer.post(f"{BASE_URL}/orders", json={
        "produce_id": produce_id,
        "quantity": 2
    })
    order_id4 = resp.json()['id'] if resp.status_code == 200 else None
    
    if order_id4:
        resp = session_buyer.put(f"{BASE_URL}/orders/{order_id4}/status", json={
            "status": "completed"
        })
        log_test(
            "Buyer cannot set status other than cancelled (403)",
            resp.status_code == 403,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )

def test_farmer_earnings():
    """Test farmer earnings calculation"""
    print("\n" + "="*80)
    print("TESTING FARMER EARNINGS")
    print("="*80)
    
    # Login farmer
    session_farmer = requests.Session()
    session_farmer.post(f"{BASE_URL}/auth/login", json={
        "email": "farmer@agridirect.in",
        "password": "farmer123"
    })
    
    # Test: GET /farmer/earnings returns numeric totals
    resp = session_farmer.get(f"{BASE_URL}/farmer/earnings")
    
    if resp.status_code == 200:
        data = resp.json()
        has_required_fields = all(k in data for k in ['total_earnings', 'pending_value', 'delivered_count', 'active_count', 'pending_count', 'total_orders'])
        all_numeric = all(isinstance(data.get(k), (int, float)) for k in ['total_earnings', 'pending_value', 'delivered_count', 'active_count', 'pending_count', 'total_orders'])
        
        log_test(
            "GET /farmer/earnings returns numeric totals",
            has_required_fields and all_numeric,
            f"Status: {resp.status_code}, Earnings: {data.get('total_earnings', 'N/A')}, Orders: {data.get('total_orders', 'N/A')}"
        )
    else:
        log_test(
            "GET /farmer/earnings returns numeric totals",
            False,
            f"Status: {resp.status_code}, Error: {resp.json().get('error', 'N/A')}"
        )

def test_wishlist():
    """Test wishlist functionality"""
    print("\n" + "="*80)
    print("TESTING WISHLIST")
    print("="*80)
    
    # Login buyer
    session_buyer = requests.Session()
    session_buyer.post(f"{BASE_URL}/auth/login", json={
        "email": "buyer@agridirect.in",
        "password": "buyer123"
    })
    
    # Get a produce item
    resp = requests.get(f"{BASE_URL}/produce")
    produce_items = resp.json() if resp.status_code == 200 else []
    
    if not produce_items:
        print("⚠️  No produce items found for wishlist testing")
        return
    
    test_produce_id = produce_items[0]['id']
    
    # Test 1: POST /buyer/wishlist adds item
    resp = session_buyer.post(f"{BASE_URL}/buyer/wishlist", json={
        "produce_id": test_produce_id
    })
    log_test(
        "POST /buyer/wishlist adds item",
        resp.status_code == 200,
        f"Status: {resp.status_code}, Wishlist: {resp.json().get('wishlist', [])[:3]}"
    )
    
    # Test 2: GET /buyer/wishlist returns produce
    resp = session_buyer.get(f"{BASE_URL}/buyer/wishlist")
    wishlist_items = resp.json() if resp.status_code == 200 else []
    has_item = any(item.get('id') == test_produce_id for item in wishlist_items)
    log_test(
        "GET /buyer/wishlist returns produce",
        resp.status_code == 200 and has_item,
        f"Status: {resp.status_code}, Count: {len(wishlist_items)}"
    )
    
    # Test 3: DELETE /buyer/wishlist/:id removes item
    resp = session_buyer.delete(f"{BASE_URL}/buyer/wishlist/{test_produce_id}")
    log_test(
        "DELETE /buyer/wishlist/:id removes item",
        resp.status_code == 200,
        f"Status: {resp.status_code}"
    )
    
    # Test 4: Verify item removed
    resp = session_buyer.get(f"{BASE_URL}/buyer/wishlist")
    wishlist_items = resp.json() if resp.status_code == 200 else []
    item_removed = not any(item.get('id') == test_produce_id for item in wishlist_items)
    log_test(
        "Item removed from wishlist",
        item_removed,
        f"Wishlist count: {len(wishlist_items)}"
    )

def test_admin_endpoints():
    """Test admin-only endpoints"""
    print("\n" + "="*80)
    print("TESTING ADMIN ENDPOINTS")
    print("="*80)
    
    # Login admin
    session_admin = requests.Session()
    session_admin.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@agridirect.in",
        "password": "admin123"
    })
    
    # Login non-admin
    session_farmer = requests.Session()
    session_farmer.post(f"{BASE_URL}/auth/login", json={
        "email": "farmer@agridirect.in",
        "password": "farmer123"
    })
    
    # Test 1: GET /admin/stats
    resp = session_admin.get(f"{BASE_URL}/admin/stats")
    log_test(
        "Admin can GET /admin/stats",
        resp.status_code == 200,
        f"Status: {resp.status_code}, Stats: {json.dumps(resp.json())[:100]}"
    )
    
    # Test 2: GET /admin/farmers
    resp = session_admin.get(f"{BASE_URL}/admin/farmers")
    log_test(
        "Admin can GET /admin/farmers",
        resp.status_code == 200 and isinstance(resp.json(), list),
        f"Status: {resp.status_code}, Count: {len(resp.json()) if resp.status_code == 200 else 0}"
    )
    
    # Test 3: GET /admin/buyers
    resp = session_admin.get(f"{BASE_URL}/admin/buyers")
    log_test(
        "Admin can GET /admin/buyers",
        resp.status_code == 200 and isinstance(resp.json(), list),
        f"Status: {resp.status_code}, Count: {len(resp.json()) if resp.status_code == 200 else 0}"
    )
    
    # Test 4: GET /admin/products
    resp = session_admin.get(f"{BASE_URL}/admin/products")
    log_test(
        "Admin can GET /admin/products",
        resp.status_code == 200 and isinstance(resp.json(), list),
        f"Status: {resp.status_code}, Count: {len(resp.json()) if resp.status_code == 200 else 0}"
    )
    
    # Test 5: GET /admin/orders
    resp = session_admin.get(f"{BASE_URL}/admin/orders")
    log_test(
        "Admin can GET /admin/orders",
        resp.status_code == 200 and isinstance(resp.json(), list),
        f"Status: {resp.status_code}, Count: {len(resp.json()) if resp.status_code == 200 else 0}"
    )
    
    # Test 6: Non-admin gets 403 for all admin endpoints
    endpoints = ['/admin/stats', '/admin/farmers', '/admin/buyers', '/admin/products', '/admin/orders']
    all_forbidden = True
    for endpoint in endpoints:
        resp = session_farmer.get(f"{BASE_URL}{endpoint}")
        if resp.status_code != 403:
            all_forbidden = False
            break
    
    log_test(
        "Non-admin gets 403 for all admin endpoints",
        all_forbidden,
        f"All admin endpoints return 403 for non-admin: {all_forbidden}"
    )

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("AGRIDIRECT BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    try:
        # Run all test suites
        sessions = test_auth()
        farmer_sessions = test_role_separation(sessions)
        test_produce_ownership(farmer_sessions)
        test_public_browse()
        test_orders_and_stock()
        test_order_status_workflow()
        test_buyer_cancel()
        test_farmer_earnings()
        test_wishlist()
        test_admin_endpoints()
        
        # Print summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        print(f"✅ Passed: {test_results['passed']}")
        print(f"❌ Failed: {test_results['failed']}")
        print(f"Total: {test_results['passed'] + test_results['failed']}")
        
        if test_results['failed'] > 0:
            print("\n" + "="*80)
            print("FAILED TESTS:")
            print("="*80)
            for error in test_results['errors']:
                print(f"❌ {error}")
        
        print("="*80)
        
        # Exit with appropriate code
        sys.exit(0 if test_results['failed'] == 0 else 1)
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
