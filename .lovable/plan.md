

## Hostel Bed Map -- Mirror of Seat Map (VendorSeats)

### Problem
The current hostel bed management page (`HostelBedManagementPage.tsx`) uses a tabbed layout with floor plan designer, which is completely different from the Seat Map page. You want an identical UI to the Seat Map screenshot -- stats bar, filters, color-coded bed grid, table view toggle, and a right-side sheet with booking/block/transfer/renew actions.

### What Will Be Built

A new page `src/pages/admin/HostelBedMap.tsx` that mirrors `VendorSeats.tsx` exactly, adapted for hostel data.

### Layout (identical to Seat Map)

```text
Stats Bar:  [TOTAL] | [BOOKED] | [AVAILABLE] | [EXPIRING] | [BLOCKED] | [REVENUE]

Filters:    [All Hostels v]  [27 Feb 2026]  [All Status v]  [Search bed...]  [Grid|Table]  [Refresh]

Legend:     * Available  * Booked  * Expiring  * Blocked                        XX beds

Grid:       [B1]  [B2]  [B3]  [B4]  [B5]  [B6]  [B7]  [B8]  [B9]  [B10]
            Cat   Cat   Cat   Cat   Cat   Cat   Cat   Cat   Cat   Cat
            P     P     P     P     P     P     P     P     P     P
            Avl   Bkd   Avl   Avl   Bkd   Avl   Blkd  Avl   Avl   Avl
            (hover: Lock/Edit/Info icons)

Sheet (right side on bed click):
  - Bed #X header with category badge and price
  - Status bar (color-coded)
  - If Booked: Student info card + Renew / Book Future / Transfer Bed / Block buttons
  - If Available: Booking form (student search, duration, price, discount, payment method, 2-step confirm)
  - If Blocked: Block history + Unblock button
  - Current & Future bookings list with paid/due info, receipts, due collection
  - Booking success view with invoice download
```

### Data Flow

Since hostel data lives in the cloud database (not MongoDB like reading rooms), the page will query directly:

- **Hostels list**: `hostels` table (for the hostel dropdown filter)
- **Beds for date**: `hostel_beds` joined with `hostel_sharing_options` and `hostel_rooms`, plus `hostel_bookings` filtered by date overlap to compute `dateStatus` (available/booked/expiring/blocked)
- **Booking actions**: Direct inserts/updates on `hostel_bookings`, `hostel_beds`, `hostel_receipts`
- **Student search**: Query `profiles` table
- **Block/Unblock**: Update `hostel_beds.is_blocked` + `block_reason`
- **Transfer**: Update `hostel_bookings.bed_id` + toggle `is_available` on old/new beds
- **Due collection**: Query/create entries in `hostel_receipts`

### Key Differences from Seat Map

| Feature | Seat Map (VendorSeats) | Hostel Bed Map |
|---|---|---|
| Data source | MongoDB via `vendorSeatsService` | Cloud DB via direct queries |
| Property selector | "All Reading Rooms" dropdown | "All Hostels" dropdown |
| Unit label | "S1, S2..." | "B1, B2..." |
| Locker system | Yes (locker toggle in booking) | No (no locker for hostels) |
| Slot system | Yes (morning/evening slots) | No (no slots for hostels) |
| Category source | `seat_categories` table | `hostel_bed_categories` table |
| Price source | `seats.price` | `hostel_sharing_options.price_monthly` + `hostel_beds.price_override` |
| Expiring logic | Booking end_date within 5 days | Same logic |
| Advance booking | Uses cabin advance settings | Uses hostel advance settings |
| Receipts | `receipts` table | `hostel_receipts` table |

### Sidebar Navigation

Add "Bed Map" link under the Hostels section in AdminSidebar, pointing to `/admin/hostel-bed-map`.

### Route

Add `/admin/hostel-bed-map` route in `App.tsx`.

### Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `src/pages/admin/HostelBedMap.tsx` | **New** | Full page mirroring VendorSeats.tsx (~1800 lines) with hostel data |
| `src/components/admin/AdminSidebar.tsx` | **Edit** | Add "Bed Map" link under Hostels section |
| `src/App.tsx` | **Edit** | Add route for `/admin/hostel-bed-map` |

### Features Included (same as Seat Map)

1. Stats bar (Total, Booked, Available, Expiring, Blocked, Revenue)
2. Hostel filter dropdown + Date picker + Status filter + Search + Grid/Table toggle
3. Color-coded bed cards (green=available, red=booked, amber=expiring, grey=blocked)
4. Hover actions on each bed (Lock/Unlock, Edit Price, View Details)
5. Right-side Sheet with:
   - Bed info header with status
   - Current student info card (when booked)
   - Action buttons: Renew, Book Future, Transfer Bed, Block
   - Full booking form with student search/create, duration selector, price, discount, payment method
   - Two-step booking confirmation
   - Advance booking mode with due date
   - Booking success view with invoice download
   - Inline due collection for partial-paid bookings
   - Current/Future/Past bookings list
   - Receipts dialog
6. Price edit dialog
7. Block/Unblock dialog with reason and date range
8. Transfer bed dialog
9. Table view with sortable columns

