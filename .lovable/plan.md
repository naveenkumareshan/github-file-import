

# Theme Colors + Dashboard Error Fix + Coupon in Partner Subscriptions

## 1. Fix "Invalid time value" Error in Dashboard

**Root Cause**: `DashboardExpiringBookings.tsx` uses old MongoDB-style field names (`booking._id`, `booking.studentName`, `booking.cabinId?.name`, `booking.seatId?.number`) but the Supabase schema uses `booking.id`, `booking.customer_name`, and joined relations `profiles.name`, `cabins.name`, `seats.number`.

The `getExpiringBookings` query in `adminBookingsService.ts` joins with `profiles`, `cabins`, and `seats` using aliases. The component needs to map these correctly.

**Fix `DashboardExpiringBookings.tsx`:**
- Change `booking._id` to `booking.id`
- Change `booking.studentName` to `booking.profiles?.name || booking.customer_name`
- Change `booking.studentPhone` / `booking.studentEmail` to `booking.profiles?.phone` / `booking.profiles?.email`
- Change `booking.cabinId?.name` to `booking.cabins?.name`
- Change `booking.seatId?.number` to `booking.seats?.number`
- Change `booking.endDate` to `booking.end_date`
- Add null guard in `formatDate` to prevent "Invalid time value" when `end_date` is null
- Change `booking.bookingId` in navigation to `booking.id`

**Fix `adminBookingsService.ts` `getActiveResidents`:**
- Currently returns raw data instead of the expected `{ activeResidents, totalCapacity, occupancyPercentage }` object that `DynamicStatisticsCards` expects
- Calculate counts from the returned bookings array and return the proper structure

## 2. Add Theme Colors to Admin and Partner Pages

Apply the brand color palette (primary deep blue, secondary green, accent teal) across admin/partner pages that are currently plain white/black. Changes to these key files:

**`DynamicStatisticsCards.tsx`:**
- Add subtle gradient headers or colored left-border accents to each stat card
- Use primary/secondary/accent colors for the stat icons instead of `text-muted-foreground`

**`DashboardStatistics.tsx`:**
- Add primary-colored header gradient to Top Filling Reading Rooms card
- Color the occupancy progress bars with gradient from primary to accent

**`DashboardExpiringBookings.tsx`:**
- Add a primary-tinted header section
- Use brand badge colors for expiry dates

**`AdminDashboard.tsx`:**
- Add a gradient header banner (primary to accent) for the greeting area

**`RevenueChart.tsx` and `OccupancyChart.tsx`:**
- Update chart colors from hardcoded purples (#7E69AB, #6E59A5) to brand primary/secondary colors

**`AdminLayout.tsx`:**
- The header already has a subtle gradient; enhance slightly with brand colors

**General pattern applied to admin pages:**
- Card headers get subtle `bg-primary/5` or `border-l-4 border-primary` accents
- Page titles use `text-primary` where appropriate
- Stat numbers use brand color highlights
- Empty states use brand-colored icons

## 3. Add Coupon Application to Partner Subscriptions

Allow admin to assign specific coupons to partner subscriptions so partners can apply them during checkout.

**Changes to `MySubscriptions.tsx`:**
- Add a "Have a coupon?" input field in Step 3 (Order Summary) before the Pay button
- On coupon entry, validate using `couponService.validateCoupon(code, 'subscription', totalAmount)`
- If valid, show the coupon discount line in the order summary and deduct from total
- Pass `couponCode` in the edge function request body

**Changes to `subscription-create-order/index.ts`:**
- Accept optional `couponCode` parameter
- If provided, look up the coupon in the `coupons` table, validate it (active, within dates, applicable_for includes 'subscription' or 'all', min_order_amount check)
- Apply the coupon discount after plan discount and capacity upgrades
- Store `coupon_id` and `coupon_discount` in the subscription record
- After successful order creation, increment the coupon's `usage_count`

**Database migration:**
- Add `coupon_id` (uuid, nullable, references coupons) and `coupon_discount` (numeric, default 0) columns to `property_subscriptions` table

**Changes to `SubscriptionPlans.tsx` (Admin):**
- No changes needed here -- admin can already create coupons with `applicable_for: ['subscription']` via the Coupon Management page. The coupon system already supports targeting by booking type.

---

## Files to Create
None

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/DashboardExpiringBookings.tsx` | Fix field mappings from MongoDB to Supabase schema, add null guards |
| `src/api/adminBookingsService.ts` | Fix `getActiveResidents` to return proper aggregated object |
| `src/components/admin/DynamicStatisticsCards.tsx` | Add brand color accents to stat cards |
| `src/components/admin/DashboardStatistics.tsx` | Add brand colors to top filling rooms card |
| `src/components/admin/RevenueChart.tsx` | Update chart colors to brand palette |
| `src/components/admin/OccupancyChart.tsx` | Update chart colors to brand palette |
| `src/pages/AdminDashboard.tsx` | Add gradient header banner with brand colors |
| `src/pages/partner/MySubscriptions.tsx` | Add coupon input in Step 3, validate and apply discount |
| `supabase/functions/subscription-create-order/index.ts` | Accept couponCode, validate, apply discount, store coupon_id |

## Database Migration

```sql
ALTER TABLE property_subscriptions
  ADD COLUMN coupon_id uuid REFERENCES coupons(id) DEFAULT NULL,
  ADD COLUMN coupon_discount numeric NOT NULL DEFAULT 0;
```

