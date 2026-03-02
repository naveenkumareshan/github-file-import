

# Food Policy System for InhaleStays Hostels

## Overview
Replace the current simple `food_enabled` boolean + `food_price_monthly` flat price on hostels with a 3-tier Food Policy system (Not Available / Mandatory / Optional) configurable at both the hostel level and sharing-option level, with proper booking snapshots and invoice logic.

## Current State
- Hostels have `food_enabled` (boolean) and `food_price_monthly` (numeric) columns
- During booking, if `food_enabled`, a checkbox lets the student opt in/out
- `hostel_bookings` stores `food_opted` (boolean) and `food_amount` (numeric)
- Invoice shows food as a separate line item when opted

## Database Changes

### 1. Add `food_policy_type` to `hostels` table
```sql
ALTER TABLE hostels ADD COLUMN food_policy_type text NOT NULL DEFAULT 'not_available';
-- Values: 'not_available', 'mandatory', 'optional'
```
The existing `food_enabled` and `food_price_monthly` columns remain for backward compatibility. New logic reads `food_policy_type` instead.

### 2. Add `food_policy_override` to `hostel_sharing_options` table
```sql
ALTER TABLE hostel_sharing_options ADD COLUMN food_policy_override text NOT NULL DEFAULT 'inherit';
ALTER TABLE hostel_sharing_options ADD COLUMN food_price_override numeric;
-- food_policy_override values: 'inherit', 'mandatory', 'optional', 'not_available'
```

### 3. Add snapshot columns to `hostel_bookings`
```sql
ALTER TABLE hostel_bookings ADD COLUMN food_policy_type text NOT NULL DEFAULT 'not_available';
ALTER TABLE hostel_bookings ADD COLUMN food_price_snapshot numeric NOT NULL DEFAULT 0;
ALTER TABLE hostel_bookings ADD COLUMN total_amount_snapshot numeric NOT NULL DEFAULT 0;
```

## Code Changes

### 1. Hostel Form (`src/components/admin/HostelForm.tsx`)
- Add a "Food Policy" section with a `Select` dropdown: Not Available / Mandatory / Optional
- When Mandatory or Optional is selected, show the `food_price_monthly` input
- Replace the old `food_enabled` toggle logic; map the new field on save:
  - `food_policy_type` saved directly
  - `food_enabled` kept in sync (`true` for mandatory/optional, `false` for not_available`)

### 2. Sharing Option Form (where sharing options are managed)
- Add "Food Policy Override" dropdown: Inherit from Hostel / Mandatory / Optional / Not Available
- When override is Mandatory or Optional, show optional `food_price_override` input
- Inherit means the hostel-level policy applies

### 3. Student Booking Flow (`src/pages/HostelRoomDetails.tsx`)
- Compute effective food policy: if sharing option has override != 'inherit', use it; otherwise use hostel's `food_policy_type`
- Compute effective food price: if sharing option has `food_price_override`, use it; otherwise use hostel's `food_price_monthly`
- **Mandatory**: Auto-set `foodOpted = true`, hide the checkbox, show badge "Food Included", include food in rent line
- **Optional**: Show checkbox "Add Food (+Rs.X)", show badge "Food Available", update total dynamically
- **Not Available**: Show badge "No Food Facility", hide food section entirely

### 4. Booking Submission
- Store snapshot fields in the booking record:
  - `food_policy_type`: the effective policy at booking time
  - `food_price_snapshot`: the food price used
  - `total_amount_snapshot`: the final total
- Continue storing `food_opted` and `food_amount` as before for compatibility

### 5. Badges in Property Cards / Detail Pages
- Replace the current single "Food Available" chip logic:
  - Mandatory: orange badge "Food Included"
  - Optional: green badge "Food Available"  
  - Not Available: gray badge "No Food Facility"

### 6. Invoice Logic (`src/utils/invoiceGenerator.ts` + `AdminBookingDetail.tsx`)
- If `food_policy_type === 'mandatory'`: Show single line "Room Rent (Including Food)" with combined amount
- If `food_policy_type === 'optional'` and `food_opted`: Show separate line "Food Add-on" with food amount
- If not_available or not opted: No food line

### 7. Hostel Room View / Sharing Options Table
- Show effective food policy badge per sharing option in the management table

## Files to Modify

| File | Change |
|------|--------|
| **Migration** | Add 3 columns to `hostels`, 2 to `hostel_sharing_options`, 3 to `hostel_bookings` |
| `src/components/admin/HostelForm.tsx` | Add Food Policy section (Select + conditional price input) |
| `src/api/hostelService.ts` | Include `food_policy_type` in data types |
| `src/pages/HostelRoomDetails.tsx` | Effective policy resolution, conditional UI (badge/checkbox/auto-select) |
| `src/api/hostelBookingService.ts` | Add snapshot fields to booking creation payload |
| `src/utils/invoiceGenerator.ts` | Conditional line items based on policy type |
| `src/pages/AdminBookingDetail.tsx` | Use snapshot fields for invoice generation |
| `src/pages/HostelConfirmation.tsx` | Show policy-aware food display |
| Sharing option management components | Add override dropdown + price override input |
| `src/utils/shareUtils.ts` | Update share text to reflect policy type |

## Migration to run
Existing hostels with `food_enabled = true` will be migrated: `UPDATE hostels SET food_policy_type = 'optional' WHERE food_enabled = true;`

