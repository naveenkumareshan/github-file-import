

# Fix Partner Subscriptions Razorpay + Add Discount Model + Create Admin Employees Page

## 1. Fix Razorpay Not Working in Partner Subscriptions

**Problem**: `MySubscriptions.tsx` calls `window.Razorpay` directly without first loading the Razorpay SDK script. Other pages (HostelBooking, BookingRenewal, etc.) all have a `loadRazorpayScript()` helper that dynamically injects the `<script>` tag -- this page is missing it.

**Fix**: Add the same `loadRazorpayScript()` helper function to `MySubscriptions.tsx` and call it before opening the Razorpay checkout in `handlePayment()`.

## 2. Add Discount Model to Subscription Plans

**Problem**: Admin cannot offer discounts to partners on subscription plans.

**Changes**:

### Database Migration
Add discount columns to `subscription_plans` table:
- `discount_percentage` (numeric, default 0) -- percentage discount off yearly price
- `discount_label` (text, default '') -- e.g. "Launch Offer", "Early Bird"
- `discount_active` (boolean, default false) -- toggle to enable/disable the discount

### Admin UI (`SubscriptionPlans.tsx`)
Add three fields to the plan create/edit form:
- Discount Percentage input
- Discount Label input
- Discount Active toggle

Show the discount info in the plans table (new "Discount" column).

### Partner UI (`MySubscriptions.tsx`)
- Show original price with strikethrough when discount is active
- Show discounted price and discount label badge
- Calculate `totalAmount` using discounted price when applicable
- Pass discounted amount to the backend

### Edge Function (`subscription-create-order/index.ts`)
- Read discount fields from the plan record
- If discount is active, apply the percentage discount to `price_yearly` before calculating `totalAmount`
- Store original and discounted amounts in the subscription record

## 3. Create Admin Employees Page

**Problem**: Admin needs a page to manage admin-level employees with sidebar permission controls and password management.

**Approach**: Reuse the exact same pattern as the Partner Employee system (`VendorEmployees.tsx` + `VendorEmployeeForm.tsx`), but scoped to admin employees who get access to admin sidebar items.

### Database Migration
Create `admin_employees` table:
- `id` (uuid, PK)
- `admin_user_id` (uuid) -- the admin who created this employee
- `employee_user_id` (uuid) -- the auth user ID of the employee
- `name`, `email`, `phone` (text)
- `role` (text, default 'staff')
- `permissions` (text[], default '{}') -- admin sidebar permission keys
- `status` (text, default 'active')
- `created_at`, `updated_at` (timestamptz)

Enable RLS with policies:
- Admins can manage all admin employees
- Admin employees can view their own record

### New Files

**`src/api/adminEmployeeService.ts`**
Service layer for CRUD on `admin_employees` table (modeled after `vendorEmployeeService.ts`).

**`src/pages/admin/AdminEmployees.tsx`**
Main page with:
- Employee list table (Name, Email, Phone, Role, Status, Permissions, Actions)
- Add Employee button -- opens form
- View, Edit, Delete actions per employee
- Employee creation uses the existing `admin-create-user` Edge Function with role `admin` (or a new `admin_employee` role if needed)
- Password Change button -- calls `admin-reset-password` Edge Function
- Shows the login URL for employees (e.g., `/admin/login`)

**`src/components/admin/AdminEmployeeForm.tsx`**
Form with:
- Name, Email, Phone, Password (for new employees)
- Permission grid with View/Edit toggles for all admin sidebar modules:
  - **General**: Dashboard, Operations
  - **Reading Rooms**: Seat Map, Due Management, Bookings, Receipts, Key Deposits, Manage Rooms, Reviews
  - **Hostels**: Bed Map, Due Management, Bookings, Receipts, Deposits, Manage Hostels, Reviews
  - **Laundry**: Laundry Management
  - **Users**: All Users, Create User, Import Users, Coupons
  - **Partners**: All Partners, Property Approvals, Settlements, Payouts
  - **Reports, Messaging, Locations, Banners, Complaints, Support, Sponsored, Subscriptions**

### Routing
Add route in `App.tsx`:
```
/admin/employees --> AdminEmployees
```

### Sidebar
Add "Admin Employees" menu item under Settings or as a standalone item for admin role in `AdminSidebar.tsx`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/AdminEmployees.tsx` | Admin employees management page |
| `src/components/admin/AdminEmployeeForm.tsx` | Employee form with permission grid |
| `src/api/adminEmployeeService.ts` | CRUD service for admin_employees |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/partner/MySubscriptions.tsx` | Add `loadRazorpayScript()`, apply discount pricing |
| `src/pages/admin/SubscriptionPlans.tsx` | Add discount fields to form and table |
| `supabase/functions/subscription-create-order/index.ts` | Apply discount in amount calculation |
| `src/App.tsx` | Add `/admin/employees` route |
| `src/components/admin/AdminSidebar.tsx` | Add "Admin Employees" menu item |
| `src/components/AdminLayout.tsx` | Add page title mapping |

## Database Migrations

1. Add `discount_percentage`, `discount_label`, `discount_active` columns to `subscription_plans`
2. Create `admin_employees` table with RLS policies

