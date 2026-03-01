

# Partner Settlement & Payout System -- Swiggy/Zomato Style

## Overview

Complete redesign of the payout system, migrating from the legacy MongoDB/Express backend to Supabase. This creates a transparent, auditable settlement system where InhaleStays collects payments from customers and settles amounts to partners after deductions.

## Settlement Formula

```text
Total Collection
- Platform Commission
- Payment Gateway Charges (configurable)
- Refunds (if any)
- Adjustments (penalties, damages, dues)
= Net Payable to Partner
```

---

## Phase 1: Database Schema (Migration)

### New Tables

**1. `partner_payout_settings`** -- Per-partner configurable settlement rules
- `id` (uuid, PK)
- `partner_id` (uuid, FK -> partners)
- `settlement_cycle` (text: 'daily', 'weekly', '7_day_hold', '15_day_hold', 'monthly', 'custom')
- `custom_cycle_days` (integer, nullable)
- `commission_type` (text: 'percentage', 'fixed', 'hybrid')
- `commission_percentage` (numeric, default 10)
- `commission_fixed` (numeric, default 0)
- `commission_on` (text: 'room_rent', 'room_and_food', 'full_invoice')
- `gateway_charge_mode` (text: 'pass_to_partner', 'absorb_platform', 'split')
- `gateway_split_percentage` (numeric, default 50)
- `tds_enabled` (boolean, default false)
- `tds_percentage` (numeric, default 0)
- `security_hold_enabled` (boolean, default false)
- `security_hold_percentage` (numeric, default 0)
- `security_hold_days` (integer, default 30)
- `minimum_payout_amount` (numeric, default 500)
- `created_at`, `updated_at`
- Unique constraint on `partner_id`

**2. `partner_ledger`** -- Running ledger for each partner (every credit/debit entry)
- `id` (uuid, PK)
- `partner_id` (uuid, FK -> partners)
- `entry_type` (text: 'credit', 'debit')
- `category` (text: 'booking_collection', 'commission', 'gateway_fee', 'refund', 'adjustment', 'payout', 'tds', 'security_hold', 'security_release')
- `amount` (numeric)
- `running_balance` (numeric)
- `reference_type` (text, nullable: 'booking', 'hostel_booking', 'settlement', 'adjustment', 'refund')
- `reference_id` (uuid, nullable)
- `description` (text)
- `property_type` (text: 'reading_room', 'hostel')
- `property_id` (uuid, nullable)
- `created_at`

**3. `partner_settlements`** -- Settlement periods (like a Swiggy weekly statement)
- `id` (uuid, PK)
- `serial_number` (text, auto: IS-STLMT-YYYY-00001)
- `partner_id` (uuid, FK -> partners)
- `period_start` (date)
- `period_end` (date)
- `total_bookings` (integer)
- `total_collected` (numeric)
- `commission_amount` (numeric)
- `gateway_fees` (numeric)
- `refund_amount` (numeric)
- `adjustment_amount` (numeric)
- `tds_amount` (numeric)
- `security_hold_amount` (numeric)
- `net_payable` (numeric)
- `status` (text: 'draft', 'generated', 'approved', 'locked', 'paid', 'disputed')
- `approved_by` (uuid, nullable)
- `approved_at` (timestamp, nullable)
- `locked_by` (uuid, nullable)
- `locked_at` (timestamp, nullable)
- `payment_reference` (text, nullable)
- `payment_date` (date, nullable)
- `utr_number` (text, nullable)
- `payment_mode` (text, nullable: 'neft', 'imps', 'upi', 'cheque')
- `notes` (text)
- `created_at`, `updated_at`

**4. `settlement_items`** -- Individual bookings included in a settlement
- `id` (uuid, PK)
- `settlement_id` (uuid, FK -> partner_settlements)
- `booking_type` (text: 'reading_room', 'hostel')
- `booking_id` (uuid, nullable -- reading room booking)
- `hostel_booking_id` (uuid, nullable -- hostel booking)
- `student_name` (text)
- `property_name` (text)
- `room_rent` (numeric)
- `food_amount` (numeric, default 0)
- `total_amount` (numeric)
- `commission_amount` (numeric)
- `gateway_fee` (numeric, default 0)
- `net_amount` (numeric)
- `created_at`

**5. `adjustment_entries`** -- Manual adjustments by admin
- `id` (uuid, PK)
- `partner_id` (uuid, FK -> partners)
- `settlement_id` (uuid, nullable, FK -> partner_settlements)
- `type` (text: 'damage', 'penalty', 'cross_adjustment', 'previous_dues', 'manual_credit', 'refund_recovery')
- `amount` (numeric -- positive for debit from partner, negative for credit)
- `description` (text)
- `created_by` (uuid)
- `status` (text: 'pending', 'applied', 'reversed')
- `applied_at` (timestamp, nullable)
- `created_at`

**6. `payout_transactions`** -- Actual payment records
- `id` (uuid, PK)
- `settlement_id` (uuid, FK -> partner_settlements)
- `partner_id` (uuid, FK -> partners)
- `amount` (numeric)
- `payment_mode` (text)
- `utr_number` (text)
- `payment_reference` (text)
- `payment_date` (date)
- `status` (text: 'initiated', 'completed', 'failed', 'reversed')
- `processed_by` (uuid)
- `notes` (text)
- `created_at`

### Serial Number Trigger
- Add 'STLMT' prefix to `serial_counters` for settlements

### RLS Policies
- Admin: full access to all settlement tables
- Partners: SELECT on their own records (by `partner_id` matching `auth.uid()` through partners table)
- Settlements marked 'paid' or 'locked': no UPDATE/DELETE (enforced via trigger)

---

## Phase 2: Service Layer

### New File: `src/api/settlementService.ts`
Admin-facing service with methods:
- `getPartnerPayoutSettings(partnerId)` / `updatePartnerPayoutSettings(partnerId, settings)`
- `generateSettlement(partnerId, periodStart, periodEnd)` -- auto-calculate from bookings
- `getSettlements(filters)` -- list with pagination
- `getSettlementDetail(settlementId)` -- includes items and adjustments
- `approveSettlement(settlementId)` / `lockSettlement(settlementId)`
- `markSettlementPaid(settlementId, paymentData)`
- `addAdjustment(partnerId, adjustmentData)`
- `getPartnerLedger(partnerId, filters)`
- `getDashboardStats()`

### New File: `src/api/partnerEarningsService.ts`
Partner-facing service:
- `getMyEarnings(filters)` -- summary + per-booking breakdown
- `getMySettlements(filters)` -- settlement history
- `getMyLedger(filters)` -- ledger view
- `getMyPayoutSettings()` -- view-only for partner

### Remove/Deprecate
- Remove axios-based calls in `adminPayoutService.ts` and `vendorService.ts` payout methods
- Replace with Supabase-based services above

---

## Phase 3: Admin UI

### 3a. Partner Settlements Page (`src/pages/admin/PartnerSettlements.tsx`)
Compact Receipts-style table (text-[11px]) with columns:
- S.No., Settlement ID, Partner Name, Period, Total Bookings, Total Collected, Commission, Gateway Fees, Refunds, Adjustments, TDS, Net Payable, Status, Next Payout Date, Actions

Filters: Date range, Partner dropdown, Status, Payment mode

Actions:
- **Generate** -- Create settlement for a partner/period
- **View** -- Full detail dialog with items breakdown
- **Approve** -- Mark as approved
- **Lock** -- Prevent further edits
- **Mark Paid** -- Enter UTR, payment ref, mode
- **Add Adjustment** -- Create adjustment entry

Bulk actions: Generate for all partners, export

### 3b. Partner Payout Settings (`src/components/admin/PartnerPayoutSettingsDialog.tsx`)
Dialog accessible from Partner Management page and Settlement page:
- Settlement cycle selector
- Commission type/percentage/fixed inputs
- Commission-on selector
- Gateway charge mode
- TDS toggle + percentage
- Security hold toggle + percentage + days
- Minimum payout amount

### 3c. Adjustment Manager (`src/components/admin/AdjustmentManager.tsx`)
- List of adjustments per partner
- Add new: type, amount, description
- Status tracking (pending/applied/reversed)

### 3d. Partner Ledger View (`src/components/admin/PartnerLedgerView.tsx`)
- Chronological ledger with running balance
- Filter by date, category
- Export to Excel/PDF

### 3e. Update `AdminPayouts.tsx`
- Complete rewrite to use Supabase-based `settlementService`
- Remove all axios/MongoDB references
- Use compact table style matching Receipts page

---

## Phase 4: Partner UI

### 4a. My Earnings Page (`src/pages/partner/PartnerEarnings.tsx`)
Replace current `VendorPayouts` component. Show:

**Summary Cards:**
- Total Earnings (all time)
- Commission Deducted
- Net Received (paid settlements)
- Pending Settlement (generated but not paid)
- Upcoming Payout Date

**Booking-Level Breakdown Table:**
- Booking ID, Student Name, Property, Room Rent, Food, Commission, Net Earnings, Settlement Status

**Settlement History:**
- List of past settlements with download option

**Ledger Tab:**
- Running balance view

### 4b. Update Sidebar
- Rename "Payouts" to "Earnings & Settlements" for partners
- Keep "Payouts" under Reports for admin (pointing to new PartnerSettlements page)

---

## Phase 5: Settlement Generation Logic

### Auto-Generation (Database function or Edge Function)
Based on each partner's `settlement_cycle`:
1. Query all bookings (reading room + hostel) where `payment_status = 'completed'` and not yet included in a settlement
2. Apply commission based on partner's settings
3. Calculate gateway fees based on mode
4. Pull pending adjustments
5. Calculate TDS if enabled
6. Apply security hold if enabled
7. Create `partner_settlements` record with `settlement_items`
8. Create corresponding `partner_ledger` entries
9. Mark included bookings as 'settled' (add `settlement_id` column to bookings/hostel_bookings)

### Manual Generation
Admin can trigger for any partner + date range via UI.

### Refund Handling
- If refund happens before settlement: deduct from current settlement items
- If refund happens after settlement: create negative ledger entry, deducted from next cycle

---

## Phase 6: Safety & Audit Controls

- Settlements with status 'paid' or 'locked': trigger prevents UPDATE/DELETE
- Only super_admin can modify locked settlements (checked via `has_role`)
- All ledger entries are immutable (INSERT only, no UPDATE/DELETE RLS)
- `payout_transactions` tracks actual payment with UTR for audit trail

---

## Phase 7: Reports (Future-Ready)

Add to existing Reports section:
- Settlement Summary Report (date range, partner filter)
- Partner Earnings Report
- Commission Report
- TDS Report
- Pending Liability Report

Export: PDF and Excel using existing `exceljs` + `pdfkit` dependencies

---

## Bookings Table Changes

Add to both `bookings` and `hostel_bookings`:
- `settlement_status` (text: 'unsettled', 'included', 'settled', default 'unsettled')
- `settlement_id` (uuid, nullable, FK -> partner_settlements)

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/...` | All new tables, triggers, RLS |
| `src/api/settlementService.ts` | Admin settlement service |
| `src/api/partnerEarningsService.ts` | Partner earnings service |
| `src/pages/admin/PartnerSettlements.tsx` | Admin settlements page |
| `src/pages/partner/PartnerEarnings.tsx` | Partner earnings page |
| `src/components/admin/PartnerPayoutSettingsDialog.tsx` | Payout settings dialog |
| `src/components/admin/AdjustmentManager.tsx` | Adjustment entries UI |
| `src/components/admin/PartnerLedgerView.tsx` | Ledger view component |
| `src/components/admin/SettlementDetailDialog.tsx` | Settlement detail/process dialog |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes for new pages |
| `src/components/admin/AdminSidebar.tsx` | Add "Settlements" under Partners (admin), rename "Payouts" to "Earnings" (partner) |
| `src/pages/admin/AdminPayouts.tsx` | Rewrite to use new settlement service |

## Implementation Order

1. Database migration (all 6 tables + RLS + triggers + booking column additions)
2. Settlement service + partner earnings service
3. Admin Settlements page with generate/approve/lock/pay flow
4. Partner Payout Settings dialog
5. Adjustment manager
6. Partner Earnings page (replace VendorPayouts)
7. Ledger view for both admin and partner
8. Sidebar and route updates
9. Settlement generation logic (manual first, auto later)

