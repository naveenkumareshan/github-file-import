
# Fix Partner Creation Error + Complete Partner Onboarding via Lovable Cloud

## Problem Analysis

There are two issues:

1. **Partner creation shows generic error**: When creating a partner whose email already exists, the edge function returns a 409 with message "This email is already registered", but the frontend only shows "Edge Function returned a non-2xx status code" because `supabase.functions.invoke()` wraps non-2xx responses in a generic error. The actual error message from the response body is not being extracted.

2. **Partners page uses legacy backend**: The entire VendorApproval/Partner Management page (`/admin/vendors`) calls the old MongoDB backend via axios. Partners created through the edge function (Lovable Cloud) have no corresponding record in a `partners` table -- there is no such table in the database yet. So even when a partner is created successfully, they don't appear on the Partners page.

---

## Solution

### Phase 1: Database -- Create `partners` table

Create a `partners` table in the database to store partner business profiles:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid | references auth.users, unique |
| business_name | text | |
| business_type | text | default 'individual' |
| contact_person | text | |
| email | text | |
| phone | text | |
| status | text | default 'approved' (pending/approved/rejected/suspended) |
| address | jsonb | {street, city, state, pincode, country} |
| business_details | jsonb | {gstNumber, panNumber, businessLicense, description} |
| bank_details | jsonb | {accountHolderName, accountNumber, bankName, ifscCode, upiId} |
| commission_settings | jsonb | {type, value, payoutCycle} |
| serial_number | text | |
| is_active | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS policies: Admin and super_admin can CRUD. Partners can read/update their own record. Vendor employees can read their partner's record.

### Phase 2: Fix edge function error handling + auto-create partner record

**File: `supabase/functions/admin-create-user/index.ts`**

- When role is `vendor`, after creating the auth user and assigning the role, also insert a record into the `partners` table with the user's info, status='approved', and basic defaults.
- This ensures every partner created by admin immediately has a partner profile.

**File: `src/components/admin/CreateStudentForm.tsx`**

- Fix error handling: when `supabase.functions.invoke` returns an error, check if it's a `FunctionsHttpError` and read the actual response body using `error.context?.json()` to extract the real error message.
- Current broken pattern:
  ```
  if (error) throw error;  // throws generic "non-2xx" message
  ```
- Fixed pattern: extract actual error from response context.

### Phase 3: Migrate Partners page from legacy backend to Lovable Cloud

**File: `src/api/vendorApprovalService.ts`** (major rewrite)

Replace all axios calls with Supabase client queries against the new `partners` table:
- `getVendors` -> query `partners` table with filters, pagination, and joins to `profiles`
- `getVendorById` -> query single partner by id
- `updateVendorStatus` -> update `partners.status`
- `updateVendorDetails` -> update partner fields
- `getVendorStats` -> aggregate counts by status
- `exportVendors` -> fetch all filtered partners for export
- Remove axios dependency from this service

**File: `src/components/admin/VendorApproval.tsx`**

- Update to work with new Supabase-based data shape (uuid `id` instead of MongoDB `_id`, flat columns instead of nested objects from MongoDB)
- The interface `Vendor` will be updated to match the new table structure

**File: `src/components/admin/VendorStatsCards.tsx`**

- Update to use the new Supabase-based stats

**File: `src/components/admin/VendorDetailsDialog.tsx`**

- Update field references to match new data shape

### Phase 4: Partner onboarding fields in Create User form

**File: `src/components/admin/CreateStudentForm.tsx`**

When role is "Partner", show additional optional onboarding fields:
- Business Name
- Business Type (dropdown: individual, company, partnership)
- City, State

These fields will be passed to the edge function and stored in the `partners` table.

---

## Files to Create/Modify

### Database Migration:
1. Create `partners` table with RLS policies

### Modified Files:
1. `supabase/functions/admin-create-user/index.ts` -- Insert partner record when role=vendor
2. `src/components/admin/CreateStudentForm.tsx` -- Fix error handling + add partner onboarding fields
3. `src/api/vendorApprovalService.ts` -- Migrate from axios/MongoDB to Supabase
4. `src/components/admin/VendorApproval.tsx` -- Update data shape references
5. `src/components/admin/VendorStatsCards.tsx` -- Use Supabase queries
6. `src/components/admin/VendorDetailsDialog.tsx` -- Update field references

### Implementation Order:
1. Database migration (create partners table)
2. Update edge function to create partner records
3. Fix CreateStudentForm error handling + add partner fields
4. Migrate VendorApprovalService to Supabase
5. Update VendorApproval, VendorStatsCards, VendorDetailsDialog
