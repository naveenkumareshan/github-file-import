
## Three Tasks — Analysis & Plan

### Current State

**Task 1 — Banner position & multi-banner carousel:**
- `HomeBanner` already supports multiple banners with auto-slide every 4s, prev/next buttons, and dot indicators — it's fully working
- BUT it sits ABOVE "Quick Actions" in `AuthenticatedHome` (line 119 in `Index.tsx`, Quick Actions is at line 173)
- The fix is simple: move `<HomeBanner />` to render AFTER the Quick Actions grid block, not before it

**Task 2 — Seed example data (cabins/reading rooms, hostels, bookings):**
- The `cabins` table exists but is empty — no reading rooms to browse
- The `bookings` table exists but has no demo data linked to the test user
- There are no hostel records either
- We need to INSERT realistic sample rows into `cabins` and `bookings` (as the current logged-in user) using the database insert tool

**Task 3 — Student dashboard receipt UI:**
- `StudentDashboard.tsx` fetches real data from `bookingsService`, but since there's no data yet, it shows empty states
- After seeding data in Task 2, the dashboard will auto-populate
- Additionally, the "Booking History" tab should show a richer receipt-style card with a receipt/invoice look — showing status clearly for both active and expired bookings
- Currently the history tab shows a plain `<div className="border rounded-lg p-4">` — we should upgrade it to a proper receipt card with colored status bar, icon, and better layout

---

## Implementation Plan

### 1. Move Banner below Quick Actions (`src/pages/Index.tsx`)

In `AuthenticatedHome`, swap the render order:

**Current order:**
```
HomeBanner  ← line 119
Active Booking Card  ← line 122
Quick Actions  ← line 173
WhyCarousel ← line 190
```

**New order:**
```
Active Booking Card
Quick Actions
HomeBanner   ← move here, after quick actions
WhyCarousel
```

This puts the advertisement banner below the utility actions as requested.

---

### 2. Seed Sample Data (database inserts)

Insert 3 reading room cabins into the `cabins` table:

| Name | Category | City | Price | Capacity |
|---|---|---|---|---|
| Sunrise Study Hub | premium | Pune | 1500/mo | 30 |
| Scholar's Den | standard | Mumbai | 900/mo | 20 |
| Focus Zone | ac | Bangalore | 1200/mo | 25 |

Then insert 3 sample bookings for the currently logged-in student tied to these cabins — covering 3 states:
- **Active booking** — `payment_status = 'completed'`, `end_date` = 3 months from now
- **Expiring soon** — `payment_status = 'completed'`, `end_date` = 5 days from now
- **Expired/history** — `payment_status = 'completed'`, `end_date` = 30 days ago

This will make the dashboard show real data: "2 Active Bookings" in the summary, "Next Payment" date, and history tab will show the expired one.

Note: Bookings require `user_id` (the auth UUID of the logged-in student). Since we can't hardcode the UUID, we'll seed the cabins first (they're public data), and add a note that the student needs to place a real booking from the UI to see their personal receipts — OR we can create the bookings directly in the admin panel. The cabin seed is the most important part.

---

### 3. Upgrade Receipt UI in `StudentDashboard.tsx`

**Current bookings tab** — already has a nice card with `BookingExpiryDetails`. Keep this.

**History tab** — upgrade from plain border div to a receipt-style card:

```
┌─────────────────────────────────────────────────────┐
│ [colored left border based on status]               │
│  📍 Sunrise Study Hub         ✅ COMPLETED          │
│     Seat #12 · Premium                              │
│ ─────────────────────────────────────────────────── │
│  Period    │  Duration   │  Amount                  │
│  Jan→Mar   │  3 Months   │  ₹4,500                 │
│ ─────────────────────────────────────────────────── │
│  [EXPIRED badge: 30 days ago]  Booked: 1 Jan 2025  │
└─────────────────────────────────────────────────────┘
```

The left border color will indicate:
- `completed` + not expired → green border
- `completed` + expired → gray border  
- `failed` → red border
- `pending` → yellow border

Add a `BookingReceiptCard` sub-component inside `StudentDashboard.tsx` for the history tab that renders this enhanced layout. The current bookings tab stays as-is since it already has `BookingExpiryDetails`.

---

## Files to change

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Move `<HomeBanner />` after Quick Actions block |
| `src/pages/StudentDashboard.tsx` | Upgrade booking history tab with receipt-style `BookingReceiptCard` component |
| Database (cabins table) | Insert 3 sample reading room cabins |

The cabin seeding is done via the database insert tool (not a schema migration). The bookings seeding requires the user's auth UUID, so we'll seed cabins and note that bookings will show up once the student makes a booking from the UI, or the admin creates one from the admin panel.
