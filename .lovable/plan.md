

# Fix Coupon Management -- Migrate from Legacy Backend to Database

## Problem

The Coupon Management page (`/admin/coupons`) shows "Failed to fetch" because it relies on `axiosConfig.ts` which calls `http://localhost:5000/api` (the old Express/MongoDB backend). There is no running backend to respond, so every API call fails.

## Solution

Migrate the entire coupon system to the database (same pattern as the rest of the app). This is a permanent fix -- no more dependency on the legacy backend.

## Regarding Settlement Logic (Question 2)

Yes, the current settlement logic is correct: when you generate a settlement for a partner + date range, ALL unsettled online receipts (both Reading Room and Hostel) within that period are grouped into ONE settlement. Each receipt becomes a line item (`settlement_items`) inside that single settlement. This is the intended "statement-based" approach (like Swiggy/Zomato weekly payouts).

---

## Database Changes

### New Table: `coupons`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| code | text, unique, not null | Uppercase coupon code |
| name | text, not null | Display name |
| description | text | |
| type | text, not null | 'percentage' or 'fixed' |
| value | numeric, not null | Discount value |
| max_discount_amount | numeric | Cap for percentage discounts |
| min_order_amount | numeric, default 0 | Minimum order to apply |
| applicable_for | text[], default '{all}' | 'cabin', 'hostel', 'all' |
| scope | text, default 'global' | 'global', 'vendor', 'user_referral' |
| partner_id | uuid, nullable, FK -> partners | For vendor-scoped coupons |
| is_referral_coupon | boolean, default false | |
| referral_type | text, nullable | 'user_generated', 'welcome_bonus', 'friend_referral' |
| generated_by | uuid, nullable | User who generated referral |
| usage_limit | integer, nullable | null = unlimited |
| usage_count | integer, default 0 | |
| user_usage_limit | integer, default 1 | Per-user cap |
| used_by | jsonb, default '[]' | Array of {userId, usageCount, usedAt, bookingId} |
| start_date | timestamptz, not null | |
| end_date | timestamptz, not null | |
| is_active | boolean, default true | |
| first_time_user_only | boolean, default false | |
| specific_users | uuid[], default '{}' | Only these users can use |
| exclude_users | uuid[], default '{}' | These users cannot use |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### RLS Policies
- Admin: full CRUD
- Partners: SELECT on their own vendor-scoped coupons + global coupons (read-only)
- Authenticated users: SELECT on active coupons for validation/available coupons

### Serial Number
- Add 'CPNX' prefix to serial_counters (optional, coupons use `code` as identifier)

---

## Service Layer

### Rewrite: `src/api/couponService.ts`
- Remove all axios imports
- Replace with Supabase queries against the new `coupons` table
- Map snake_case DB columns to camelCase interface (or update interface to snake_case)
- All existing methods: getCoupons, getCoupon, createCoupon, updateCoupon, deleteCoupon, validateCoupon, applyCoupon, getAvailableCoupons, generateReferralCoupon

### Update: `src/components/admin/CouponManagement.tsx`
- Remove `vendorService` import (used for fetching vendor list from legacy API)
- Fetch partners from Supabase `partners` table instead
- Update field name mappings (e.g., `_id` -> `id`, `vendorId` -> `partner_id`)
- Remove MongoDB-specific patterns

---

## Files to Create/Modify

| File | Change |
|------|--------|
| Migration SQL | Create `coupons` table with RLS |
| `src/api/couponService.ts` | Complete rewrite -- Supabase instead of axios |
| `src/components/admin/CouponManagement.tsx` | Update to use new field names, fetch partners from DB |

## Implementation Order

1. Database migration (create `coupons` table + RLS + indexes)
2. Rewrite `couponService.ts` with Supabase queries
3. Update `CouponManagement.tsx` to work with the new service

