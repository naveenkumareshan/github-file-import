

## Redesign Student Laundry to Match Reading Room / Hostels / Mess Pattern + Insert Test Data

### What Changes

**1. Student-side `/laundry` page — Complete rewrite to match Cabins/Hostels/Mess listing pattern**

Replace the current multi-step wizard with:
- **Listing page** (`/laundry`): Sticky header with "Laundry Services" title, search bar, filter pills (All, Clothing, Bedding, Special or by area). Grid of laundry partner cards matching the exact same card layout as Hostels/Mess (thumbnail placeholder with Shirt icon, business name, location, delivery time badge, "View" button).
- Remove "My Orders" button from header (handled in My Bookings already).
- Clicking a partner card navigates to `/laundry/:id` (new detail page).

**2. New Laundry Detail page (`/laundry/:id`) — matches MessDetail pattern**

- Header section: partner name, service area, delivery time, operating hours
- **Items section**: Shows all partner items grouped by category (clothing/bedding/special) with +/- quantity selectors
- **Pickup Slots section**: Date picker + time slot pill selection
- **Address section**: Room, Block, Floor, Landmark fields
- **Review & Pay bottom bar**: Shows item count + total, Pay button triggers Razorpay flow
- **After payment**: Shows Pickup OTP prominently (same as current step 5)
- No separate "partner selection step" — the listing IS the partner selection

**3. Remove My Orders from laundry page**

The "My Orders" link/button is removed from the laundry header. Orders are already accessible via student bookings.

**4. Admin — Items & Slots CRUD in AdminLaundry**

Already implemented via dialogs in AdminLaundry.tsx. Verify the item form (name, icon, price, category) and slot form (name, start_time, end_time, max_orders) work correctly — these are already present.

**5. Insert test laundry partner + sample items + slots**

Using the database insert tool:
- Create a `laundry_partners` record for TestPartner (`b7223bac-ef5c-48aa-ba49-d530d15f6f8e`) with business_name "Fresh & Clean Laundry", service_area "Near Campus Gate", status "active", is_active true, is_approved true, is_booking_active true
- Insert 6 sample `laundry_items` (T-Shirt ₹30, Jeans ₹50, Bedsheet ₹40, Pillow Cover ₹20, Blanket ₹80, Kurta ₹35) linked to this partner
- Insert 3 sample `laundry_pickup_slots` (Morning 8-11, Afternoon 12-3, Evening 4-7) linked to this partner

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/Laundry.tsx` | **Rewrite** — listing page matching Cabins/Hostels/Mess grid pattern |
| `src/pages/LaundryDetail.tsx` | **New** — partner detail + item selection + booking flow |
| `src/App.tsx` | Add `/laundry/:id` route → LaundryDetail |
| `src/api/laundryCloudService.ts` | Add `getPartnerById(id)` and `getPartnerBySerialNumber(sn)` methods |
| Database | Insert test partner, items, slots |

### Layout Pattern (matches all other student pages)

```text
┌─────────────────────────────┐
│ Sticky Header               │
│  "Laundry Services"         │
│  [Search bar]               │
│  [All] [Area1] [Area2]      │
├─────────────────────────────┤
│ 3 partners found            │
│ ┌───────────────────────┐   │
│ │ 👕 │ Fresh & Clean     │   │
│ │    │ Near Campus Gate   │   │
│ │    │ 48h · View →      │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ ...                   │   │
└─────────────────────────────┘
```

Detail page follows MessDetail pattern with items, slots, address, and pay flow inline.

