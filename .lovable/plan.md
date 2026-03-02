

# Complete Laundry Service Redesign

## Overview
Replace the current Express/MongoDB-based laundry module with a fully Supabase-powered system featuring laundry partners, student ordering, OTP-based pickup verification, Razorpay payments, and partner settlements.

## Database Schema (New Tables)

### 1. `laundry_partners` - Partner profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| business_name | text | |
| contact_person | text | |
| phone | text | |
| email | text | |
| service_area | text | Locality/area they serve |
| bank_details | jsonb | For settlements |
| commission_percentage | numeric | Default 10 |
| is_active | boolean | Default true |
| status | text | pending/approved/suspended |
| serial_number | text | Auto-generated |
| created_at / updated_at | timestamptz | |

### 2. `laundry_items` - Admin-managed menu items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | e.g., "T-Shirt" |
| icon | text | Emoji |
| price | numeric | Per piece price |
| category | text | clothing/bedding/special |
| is_active | boolean | Default true |
| display_order | integer | |
| created_at | timestamptz | |

### 3. `laundry_orders` - Student orders
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| serial_number | text | Auto: IS-LNDRY-YYYY-XXXXX |
| user_id | uuid | Student |
| partner_id | uuid | Assigned laundry partner |
| status | text | pending/confirmed/pickup_scheduled/picked_up/washing/ready/out_for_delivery/delivered/cancelled |
| pickup_otp | text | 4-digit OTP shown to student |
| pickup_otp_verified | boolean | |
| delivery_otp | text | 4-digit for delivery verification |
| delivery_otp_verified | boolean | |
| pickup_address | jsonb | {room, block, floor, landmark} |
| pickup_date | date | Admin/partner controlled |
| pickup_time_slot | text | e.g., "9AM-12PM" |
| delivery_date | date | Expected delivery |
| delivery_time_slot | text | |
| total_amount | numeric | |
| payment_status | text | pending/completed/failed |
| payment_method | text | online/cash |
| razorpay_order_id | text | |
| razorpay_payment_id | text | |
| razorpay_signature | text | |
| settlement_status | text | unsettled/included/settled |
| settlement_id | uuid | |
| notes | text | |
| created_at / updated_at | timestamptz | |

### 4. `laundry_order_items` - Line items per order
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid FK | -> laundry_orders |
| item_id | uuid FK | -> laundry_items |
| item_name | text | Snapshot |
| item_price | numeric | Snapshot |
| quantity | integer | |
| subtotal | numeric | |

### 5. `laundry_receipts` - Payment receipts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| serial_number | text | Auto: IS-LRCPT-YYYY-XXXXX |
| order_id | uuid FK | |
| user_id | uuid | |
| partner_id | uuid | |
| amount | numeric | |
| payment_method | text | |
| transaction_id | text | |
| receipt_type | text | |
| settlement_status | text | unsettled/included/settled |
| settlement_id | uuid | |
| created_at | timestamptz | |

### 6. `laundry_complaints` - Student complaints
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| serial_number | text | |
| order_id | uuid FK | |
| user_id | uuid | |
| subject | text | |
| description | text | |
| status | text | open/in_progress/resolved |
| response | text | |
| created_at / updated_at | timestamptz | |

### 7. `laundry_pickup_slots` - Admin-managed time slots
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| slot_name | text | e.g., "Morning" |
| start_time | time | |
| end_time | time | |
| max_orders | integer | Capacity per slot |
| is_active | boolean | |

## RLS Policies
- Students: can view own orders/receipts/complaints, insert orders/complaints
- Laundry partners: can view/update assigned orders, view own receipts
- Admins: full access to all tables
- Public: can view active laundry_items and pickup_slots

## Application Architecture

### Student-Facing Pages

**`/laundry` - Redesigned Landing + Order Page (Mobile-first)**
- Step 1: Browse items from `laundry_items` table (admin-managed, not hardcoded)
- Step 2: Select quantities with +/- buttons, see running total
- Step 3: Enter pickup address (room, block, floor)
- Step 4: Select pickup date and time slot from `laundry_pickup_slots`
- Step 5: Review order summary with total
- Step 6: Pay via Razorpay (reuse existing edge functions with `bookingType: 'laundry'`)
- After payment: Show OTP for pickup verification

**`/student/laundry-orders` - My Laundry Orders**
- List of student's orders with status badges
- Each order expandable to show items, OTP, pickup/delivery details
- Complaint submission per order

### Admin Pages

**`/admin/laundry` - Laundry Management Dashboard**
- Tabs: Orders | Items | Partners | Pickup Slots | Settlements
- **Orders tab**: View all orders, assign partners, update status, set pickup/delivery dates
- **Items tab**: CRUD for laundry menu items (name, icon, price, category)
- **Partners tab**: Add/manage laundry partners (similar to existing partner management)
- **Pickup Slots tab**: Configure available time slots and capacity
- **Settlements tab**: Reuse existing settlement pattern -- generate settlements from `laundry_receipts`

### Laundry Partner Pages

**`/laundry-partner/dashboard` - Partner Dashboard**
- View assigned orders
- Verify pickup OTP (scan/enter)
- Update order status (picked_up -> washing -> ready -> out_for_delivery -> delivered)
- View earnings and settlement history

### Edge Function Updates

**`razorpay-create-order`**: Add `bookingType: 'laundry'` support to store `razorpay_order_id` in `laundry_orders`

**`razorpay-verify-payment`**: Add laundry verification path -- update `laundry_orders.payment_status` and create `laundry_receipts`

### New Service File: `src/api/laundryCloudService.ts`
- Replace axios-based `laundryService.ts` with Supabase client queries
- All CRUD for items, orders, receipts, complaints, partners, settlements

### Settlement Integration
- Extend existing `settlementService.ts` pattern for laundry partners
- Generate settlements from `laundry_receipts` where `payment_method = 'online'` and `settlement_status = 'unsettled'`
- Same commission/gateway/TDS/security hold calculations

## Files to Create/Modify

| File | Action |
|------|--------|
| DB Migration | Create 7 new tables + serial triggers + RLS |
| `supabase/functions/razorpay-create-order/index.ts` | Add laundry booking type |
| `supabase/functions/razorpay-verify-payment/index.ts` | Add laundry verification |
| `src/api/laundryCloudService.ts` | New Supabase-based service |
| `src/pages/Laundry.tsx` | Complete redesign -- step-based ordering flow |
| `src/pages/StudentLaundryOrders.tsx` | New -- student order history |
| `src/pages/admin/LaundryManagement.tsx` | New -- admin dashboard with tabs |
| `src/components/laundry/LaundryItemSelector.tsx` | New -- item picker component |
| `src/components/laundry/LaundryOrderCard.tsx` | New -- order card with status |
| `src/components/laundry/LaundryPartnerDashboard.tsx` | New -- partner view |
| `src/components/laundry/LaundrySettlements.tsx` | New -- settlement module |
| Route config (App.tsx) | Add new routes |

## OTP Flow
1. Student places order and pays -> system generates random 4-digit `pickup_otp`
2. Student sees OTP on their order details page
3. Laundry partner arrives at pickup -> student shares OTP
4. Partner enters OTP in their dashboard -> verified, status moves to `picked_up`
5. Same flow for delivery with `delivery_otp`

## Implementation Order
1. Database migration (all tables, triggers, RLS)
2. Update edge functions for Razorpay
3. Create `laundryCloudService.ts`
4. Build admin Laundry Items management
5. Build student ordering flow (Laundry.tsx redesign)
6. Build student order history page
7. Build admin order management
8. Build laundry partner dashboard
9. Build settlement module for laundry partners
10. Add routes to App.tsx

