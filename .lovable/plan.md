
# Food Module for Hostel -- Full Integration Plan

## Overview
Add an optional Food Facility system for hostels that integrates into the entire booking, payment, dues, and reporting pipeline. Partners/admins can enable food per hostel, set pricing/menu, and students can optionally add food during booking.

---

## Phase 1: Database Schema

### New Table: `hostel_food_menu`
Stores food menu items per hostel.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| hostel_id | uuid FK | references hostels |
| meal_type | text | 'breakfast', 'lunch', 'dinner' |
| item_name | text | e.g. "Idli Sambar" |
| display_order | integer | default 0 |
| is_active | boolean | default true |
| created_at | timestamptz | |

RLS: Admins full access, Partners manage own hostel items, Anyone can view active items.

### Alter `hostels` table -- add columns:
- `food_enabled` boolean default false
- `food_price_monthly` numeric default 0
- `food_menu_image` text (optional uploaded weekly/monthly menu image)

### Alter `hostel_bookings` table -- add columns:
- `food_opted` boolean default false
- `food_amount` numeric default 0

### Alter `hostel_dues` table -- add column:
- `food_amount` numeric default 0 (stored separately for clarity in breakdowns)

---

## Phase 2: Partner/Admin -- Hostel Settings (HostelEditor.tsx)

Add a new collapsible **Section 5: Food Facility** (renumber existing sections 5-8 to 6-9):

- **Toggle**: "Offer Food Facility" (Switch for `food_enabled`)
- When ON, show:
  - **Monthly Food Price** (number input for `food_price_monthly`)
  - **Food Menu Items** section:
    - Three sub-sections: Breakfast, Lunch, Dinner
    - Each has an editable list of items (add/remove)
    - Items saved to `hostel_food_menu` table
  - **Upload Menu Image** (optional, uses existing ImageUpload component to `hostel-images` bucket)
  - Save button persists all food settings

### Also update:
- `hostelService.ts` -- `HostelData` interface to include `food_enabled`, `food_price_monthly`, `food_menu_image`
- HostelEditor state initialization to include new food fields

---

## Phase 3: Student Side -- Hostel Detail Page (HostelRoomDetails.tsx)

### Info Chips section:
- Add a "Food Available" chip (green with Utensils icon) when `hostel.food_enabled` is true
- Also show on hostel listing cards (Hostels.tsx) as a small badge

### New Step between Package and Review:
- Show **"Add Monthly Food Plan"** checkbox when `hostel.food_enabled` is true
- Display: "Add Monthly Food Plan (+ {formatCurrency(food_price_monthly)}/mo)"
- "View Food Menu" link that opens a Dialog/Modal showing:
  - Menu items grouped by Breakfast/Lunch/Dinner from `hostel_food_menu`
  - Optional uploaded menu image

### Price Calculation Updates:
- Add state: `const [foodOpted, setFoodOpted] = useState(false);`
- Food amount = `hostel.food_price_monthly * durationCount` (for monthly; scale for daily/weekly)
- Update `totalPrice` to include food: `(discountedPrice * durationCount) + foodTotal`
- Update `payableAmount` accordingly
- Grand Total in Review section shows:
  - Room Rent line
  - Food Charges line (if opted)
  - Security Deposit line
  - Total

### Booking Data:
- Pass `food_opted: true/false` and `food_amount` in `bookingData` to `hostelBookingService.createBooking()`

---

## Phase 4: Booking Service Updates (hostelBookingService.ts)

- Update `CreateHostelBookingData` interface to include `food_opted` and `food_amount`
- Pass these fields through to the `hostel_bookings` insert
- When creating `hostel_dues` for advance bookings, include `food_amount` in the total_fee calculation

---

## Phase 5: Confirmation & Invoice

### HostelConfirmation.tsx:
- Show "Food Plan" row in booking details grid when `booking.food_opted` is true
- Display food amount alongside total

### AdminBookingDetail.tsx:
- In Payment Summary grid, add "Food Charges" row when `booking.food_opted`
- Invoice download: add food as separate line item in `invoiceData` (update `InvoiceData` interface and `downloadInvoice` utility)

---

## Phase 6: Dues, Renewals & Dashboard Integration

### HostelDueManagement.tsx:
- Display food_amount column in due records when applicable
- Monthly dues calculation: Room Rent + Food (when opted)

### AdminHostelBookings.tsx (booking list):
- In the Amount 2x2 grid, add food amount visibility (e.g., show "Food: X" in the grid)

### StudentBookings.tsx:
- Show food charges in booking amount display when `food_opted` is true

### Partner Booking Management (HostelBedMap.tsx manual booking):
- Add food opt-in checkbox in the manual booking dialog
- Include food in price calculation

---

## Phase 7: Hostel Listing Cards

### Hostels.tsx (listing page):
- Add small "Food" badge on hostel cards when `food_enabled` is true (using Utensils icon from lucide-react)

---

## Files to Create/Modify

### New Files:
1. `src/components/hostels/FoodMenuModal.tsx` -- Modal to display food menu items + image

### Database Migration:
1. Create `hostel_food_menu` table with RLS
2. Add columns to `hostels`, `hostel_bookings`, `hostel_dues`

### Modified Files (approx 12 files):
1. `src/components/admin/HostelEditor.tsx` -- Food settings section
2. `src/api/hostelService.ts` -- HostelData interface
3. `src/api/hostelBookingService.ts` -- Food fields in booking
4. `src/pages/HostelRoomDetails.tsx` -- Food checkbox, menu link, price calc
5. `src/pages/HostelConfirmation.tsx` -- Food row in details
6. `src/pages/AdminBookingDetail.tsx` -- Food in payment summary & invoice
7. `src/pages/admin/HostelDueManagement.tsx` -- Food amount display
8. `src/pages/hotelManager/AdminHostelBookings.tsx` -- Food in amount grid
9. `src/pages/StudentBookings.tsx` -- Food in booking display
10. `src/pages/admin/HostelBedMap.tsx` -- Food in manual booking
11. `src/pages/Hostels.tsx` -- Food badge on cards
12. `src/utils/invoiceGenerator.ts` -- Food line item in invoice
13. `src/integrations/supabase/types.ts` -- Auto-updated after migration

### Implementation Order:
1. Database migration (tables + columns)
2. HostelEditor food settings + FoodMenuModal
3. Student booking flow (HostelRoomDetails)
4. Booking service + confirmation
5. Admin/partner dashboards + invoice + dues
6. Hostel listing cards
