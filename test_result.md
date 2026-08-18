#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  AgriDirect – West Godavari. Direct farmer-to-buyer agricultural marketplace (Smart India Hackathon
  prototype). Roles: farmer, buyer, admin. Built on Next.js + MongoDB with custom JWT (httpOnly cookie)
  auth (Supabase-style profiles/products/orders structure). Bilingual EN/Telugu. Stage 3 added: stock
  validation + auto-decrement on order, wishlist, richer order statuses (pending→accepted→processing→
  ready→completed, plus rejected/cancelled), mandal/quality/village fields, marketplace filters.

backend:
  - task: "Auth: register, login, logout, me, profile (JWT httpOnly cookie)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Custom JWT auth via httpOnly cookie + Bearer fallback. Demo accounts seeded. Verify register/login/me/logout/profile-update and role separation."
        -working: true
        -agent: "testing"
        -comment: "✅ All 9 auth tests passed. Verified: register new farmer/buyer (200), login with all demo accounts (farmer@agridirect.in, buyer@agridirect.in, admin@agridirect.in), GET /auth/me returns authenticated user, PUT /auth/profile updates fields (phone, village), POST /auth/logout clears session, after logout /auth/me returns 401. httpOnly cookie authentication working correctly."
  - task: "Produce CRUD + public browse with filters (search, category, mandal, price, sort)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /produce with filters; POST/PUT/DELETE owner-only; /farmer/produce; /mandals. Verify owner enforcement (farmer cannot edit others' produce)."
        -working: true
        -agent: "testing"
        -comment: "✅ All 15 produce tests passed. Role separation: farmer can POST /produce (200), buyer gets 403. Ownership: Farmer A creates produce, Farmer B cannot PUT/DELETE (403), owner can update/delete own produce. Public browse: GET /produce returns 9 seeded items, filters work (?search=paddy found 3 items, ?category=Banana found 2, ?mandal=Bhimavaram found 5, ?min_price=20&max_price=30 found 5), sort works (price_asc/desc), GET /mandals returns distinct mandals, GET /produce/:id returns single item (200), invalid ID returns 404."
  - task: "Orders: place (stock check + decrement), buyer/farmer lists, status transitions, buyer cancel, earnings"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Order decrements produce.quantity and marks unavailable at 0. Farmer flow pending->accepted->processing->ready->completed and reject. Buyer can cancel pending/accepted. Reject invalid transitions and over-stock orders."
        -working: true
        -agent: "testing"
        -comment: "✅ All 18 order tests passed. Stock management: buyer places order within stock (200), stock decreases correctly (initial 99, ordered 2, new 97), ordering more than stock rejected (400), order depleting stock to 0 succeeds, produce marked unavailable when quantity=0, cannot order unavailable produce (400). Status workflow: valid transitions pending→accepted→processing→ready→completed all work (200), invalid transition pending→completed rejected (400), farmer can reject pending order, farmer cannot update another farmer's order (403). Buyer cancel: can cancel pending/accepted orders (200), cannot cancel completed order (400), cannot set status other than 'cancelled' (403). Earnings: GET /farmer/earnings returns numeric totals (total_earnings: 10060, total_orders: 9)."
  - task: "Wishlist (buyer): add/remove/list"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Stored as array on user doc. GET/POST/DELETE /buyer/wishlist. Buyer-only."
        -working: true
        -agent: "testing"
        -comment: "✅ All 5 wishlist tests passed. Role separation: buyer can GET /buyer/wishlist (200), farmer gets 403. Functionality: POST /buyer/wishlist adds item (200), GET returns produce with added item, DELETE /buyer/wishlist/:id removes item (200), verified item removed from wishlist."
  - task: "Admin: stats, farmers, buyers, products, orders (admin-only)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Admin endpoints require role=admin. Verify non-admin gets 403."
        -working: true
        -agent: "testing"
        -comment: "✅ All 8 admin tests passed. Admin access: admin can GET /admin/stats (200, returned farmers:3, buyers:2, products:13, orders:10, gmv:10060), /admin/farmers (200, count:3), /admin/buyers (200, count:2), /admin/products (200, count:13), /admin/orders (200, count:10). Role enforcement: farmer gets 403 for /admin/stats, buyer gets 403 for /admin/stats, all admin endpoints return 403 for non-admin users."

frontend:
  - task: "Full SPA (hash routing, EN/TE, dashboards, marketplace, wishlist)"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Frontend not yet tested by automation; awaiting user go-ahead."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Auth: register, login, logout, me, profile (JWT httpOnly cookie)"
    - "Produce CRUD + public browse with filters (search, category, mandal, price, sort)"
    - "Orders: place (stock check + decrement), buyer/farmer lists, status transitions, buyer cancel, earnings"
    - "Wishlist (buyer): add/remove/list"
    - "Admin: stats, farmers, buyers, products, orders (admin-only)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: |
      Please test the AgriDirect backend at the /api prefix (same-origin). Auth uses httpOnly cookies
      (sameSite=lax, secure) set on login/register — use a cookie jar / session that preserves cookies;
      a Bearer token is also accepted (login/register also work if you capture the JWT). Demo accounts
      (already seeded): farmer@agridirect.in/farmer123, lakshmi@agridirect.in/farmer123,
      buyer@agridirect.in/buyer123, admin@agridirect.in/admin123.
      Key scenarios: (1) role separation (farmer-only produce create, buyer-only orders/wishlist,
      admin-only admin routes -> 403 otherwise); (2) farmer cannot edit/delete another farmer's produce;
      (3) placing an order decrements produce.quantity and blocks over-stock/unavailable orders;
      (4) order status transitions valid path + invalid transition rejected; buyer cancel only when
      pending/accepted; (5) marketplace filters search/category/mandal/price/sort; (6) wishlist add/list/remove.
    -agent: "testing"
    -message: |
      ✅ BACKEND TESTING COMPLETE - ALL TESTS PASSED (61/61)
      
      Comprehensive backend API testing completed successfully. All 10 test scenarios from the review request
      have been thoroughly tested with concrete evidence:
      
      1. ✅ Auth (9 tests): register farmer/buyer, login all demo accounts, /auth/me, profile update, logout
      2. ✅ Role separation (9 tests): farmer-only produce POST, buyer-only orders/wishlist, admin-only admin routes
      3. ✅ Produce ownership (5 tests): farmer A creates, farmer B cannot edit/delete (403), owner can modify
      4. ✅ Public browse (10 tests): filters (search, category, mandal, price), sort (asc/desc), mandals, 404
      5. ✅ Orders + stock (6 tests): order within stock, stock decrement, over-stock rejected, unavailable handling
      6. ✅ Order status workflow (7 tests): valid transitions, invalid rejected, farmer reject, ownership
      7. ✅ Buyer cancel (4 tests): cancel pending/accepted, cannot cancel completed, only 'cancelled' status
      8. ✅ Farmer earnings (1 test): numeric totals returned correctly
      9. ✅ Wishlist (4 tests): add, list, remove, verification
      10. ✅ Admin endpoints (6 tests): all admin routes work, non-admin gets 403
      
      Evidence highlights:
      - Stock management: Initial 99, ordered 2, new 97 (correct decrement)
      - Status transitions: pending→accepted→processing→ready→completed all work
      - Role enforcement: All unauthorized access returns 403
      - Filters: search=paddy (3 items), category=Banana (2 items), mandal=Bhimavaram (5 items)
      - Admin stats: farmers:3, buyers:2, products:13, orders:10, gmv:10060
      
      All backend APIs are working correctly with proper authentication, authorization, validation, and business logic.