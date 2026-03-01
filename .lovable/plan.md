

# Sponsored Listings Enhancement -- UI Standardization, Packages, Area Display, and User Creation Fix

## 3 Changes Requested

### 1. Standardize UI to Match Receipts Pattern (Admin + Partner)

**Problem:** Current Sponsored Listings admin page and Partner My Promotions page don't follow the standardized admin UI pattern used by Receipts, Dues, etc (S.No, serial numbers, pagination, filters, search, compact density).

**Changes:**

**Database Migration:**
- Add `serial_number` column to `sponsored_listings` table
- Create trigger `set_serial_sponsored_listings` using prefix `SPAD` (Sponsored Ad)
- Display area names alongside city in both admin table and partner view

**Admin Page (`src/pages/admin/SponsoredListings.tsx`) -- Full Rewrite to Match Receipts UI:**
- Add summary bar at top (Total Listings, Active, Paused, Expired counts)
- Add compact single-line filter row: Search input + Property Type filter + Tier filter + Status filter + Date range (From/To) + Clear button
- Table with S.No column (cross-page continuity via `getSerialNumber`)
- Add serial_number column (font-mono display like receipts)
- Add Area Names column (resolve `target_area_ids` to names, show as comma-separated)
- Add `AdminTablePagination` component with page size selector
- Import and use existing `AdminTablePagination` and `getSerialNumber` from `@/components/admin/AdminTablePagination`
- Add Refresh and Export buttons in header
- Keep existing Create/Edit dialog and action buttons

**Partner Page (`src/pages/partner/MyPromotions.tsx`) -- Upgrade to Table View:**
- Switch from card layout to standardized table layout matching admin pattern
- Add S.No, Serial Number, Property, Tier, City, Areas, Dates, Days Left, Status, Stats columns
- Add search + status filter + pagination
- Keep read-only (no edit/delete actions)
- Show area names resolved from `target_area_ids`

---

### 2. Sponsored Listing Packages -- Partner Self-Service Booking

**Concept:** Admin creates reusable "Ad Packages" (e.g., "7-Day Featured Boost -- Rs 999", "30-Day Inline Sponsor -- Rs 2499"). Partners can browse available packages and book them for their properties (creating a sponsored listing tied to a package).

**Database Migration:**
- Create `sponsored_packages` table:
  - `id` (uuid, PK)
  - `name` (text) -- e.g. "7-Day Featured Boost"
  - `description` (text)
  - `tier` (text: featured / inline_sponsored / boost_ranking)
  - `duration_days` (integer) -- auto-calculates end_date from start
  - `price` (numeric) -- package cost
  - `is_active` (boolean, default true)
  - `serial_number` (text, auto-generated with prefix `SPKG`)
  - `created_by` (uuid)
  - `created_at` (timestamptz)
- Add `package_id` column (uuid, nullable, FK) to `sponsored_listings` table
- Add `payment_status` column (text: 'pending' | 'paid' | 'admin_created', default 'admin_created') to `sponsored_listings`
- RLS: Admins full CRUD; Partners + Public can SELECT active packages

**Admin -- Package Manager Section:**
- Add a "Packages" tab or section within the Sponsored Listings page
- CRUD for packages: Name, Description, Tier, Duration (days), Price, Status
- Table with S.No, Serial Number, Name, Tier, Duration, Price, Status, Actions

**Partner -- Book a Package (in My Promotions page):**
- "Book Ad Package" button at top
- Dialog/sheet showing available packages as cards (name, tier badge, duration, price)
- Partner selects package, then selects:
  - Property (from their own properties only)
  - Target City + Areas
  - Start Date (end date auto-calculated from package duration)
- On submit: creates a `sponsored_listings` row with `status = 'pending'`, `payment_status = 'pending'`, `package_id` set
- Admin must then approve (change status to 'active') -- keeps admin control intact
- Future: integrate with payment gateway (for now, partner submits request, admin approves after offline payment confirmation)

---

### 3. Remove Employee Option from Partner User Creation

**Problem:** The CreateStudentForm allows partners (role = 'vendor') to create users with role 'vendor_employee'. There is already a separate dedicated Employee management section, so the employee option in the user creation form is redundant for partners.

**File:** `src/components/admin/CreateStudentForm.tsx`

**Change:** When user role is 'vendor', filter out `vendor_employee` from the role options. Partners should only be able to create Students from the user creation form. Employee creation is handled separately via the dedicated employee management module.

Current code (line 37-39):
```typescript
if (user?.role === 'vendor') {
  return ROLE_OPTIONS.filter(r => r.value === 'student' || r.value === 'vendor_employee');
}
```

Change to:
```typescript
if (user?.role === 'vendor') {
  return ROLE_OPTIONS.filter(r => r.value === 'student');
}
```

---

## Technical Summary

| Action | File / Resource |
|--------|----------------|
| DB Migration | Add `serial_number` to `sponsored_listings`, create trigger |
| DB Migration | Create `sponsored_packages` table with serial number trigger |
| DB Migration | Add `package_id`, `payment_status` columns to `sponsored_listings` |
| Rewrite | `src/pages/admin/SponsoredListings.tsx` (receipts-style UI + packages tab) |
| Rewrite | `src/pages/partner/MyPromotions.tsx` (table UI + book package flow) |
| Edit | `src/components/admin/CreateStudentForm.tsx` (remove employee from partner role options) |

