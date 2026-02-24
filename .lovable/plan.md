

## Redesign: Seat Control Center

Complete redesign of `src/pages/vendor/VendorSeats.tsx` from a card-based layout into a compact, data-dense operational dashboard with grid-first seat visualization, date-aware booking checks, and a right-side booking drawer.

---

### Architecture

The page will be restructured into three visual layers:

```text
+------------------------------------------------------------------+
| Stats Bar (60px max height, single horizontal row)               |
| Total | Booked | Available | Expiring | Blocked | Revenue        |
+------------------------------------------------------------------+
| Filter Row (sticky, single line)                                 |
| [Room v] [Date] [Status v] [Search...] [Grid|Table]             |
+------------------------------------------------------------------+
| Seat Grid (default) or Table View                                |
| [S1][S2][S3][S4][S5][S6][S7][S8][S9][S10][S11][S12]...         |
| [S13][S14][S15]...                                               |
|                                                                  |
+------------------------------------------------------------------+
```

Right-side Sheet drawer opens on seat click for details or booking.

---

### 1. Stats Bar

Replace the 4 large cards with a single slim horizontal bar (max-h-[60px]), using inline flex items:

| Metric | Source |
|--------|--------|
| Total Seats | `seats.length` |
| Booked | Seats with active booking for selected date |
| Available | Available and no booking for selected date |
| Expiring Soon | Booking end_date within 7 days of selected date |
| Blocked | `!isAvailable` (manually blocked) |
| Revenue | Sum of `totalPrice` from active bookings |

Each stat is a small pill: icon + label + value, separated by thin dividers. No cards, no padding.

---

### 2. Sticky Filter Row

Single horizontal row with `sticky top-0 z-10 bg-background`:

- **Reading Room dropdown**: Same Select component, compact (h-8)
- **Date picker**: Single date (default today). When changed, re-fetches bookings for that date and recalculates all statuses
- **Status filter**: All / Available / Booked / Expiring Soon / Blocked
- **Search**: Input for seat number search
- **View toggle**: Grid (default) / Table icon buttons

All filters are inline, no labels, placeholder text only. Height ~40px.

---

### 3. Grid View (Default)

Tight CSS grid of seat boxes:
- `grid-cols-[repeat(auto-fill,minmax(68px,1fr))]` for 10-15 seats per row
- Each box: 68px square, `p-1`, `text-[10px]`
- Content per box:
  - Seat number (bold, top)
  - Category (tiny text)
  - Price (tiny text)
  - Status badge (color-coded dot or bg)
  - Two micro action buttons on hover: availability toggle + price edit
- Color coding via background:
  - `bg-emerald-50 border-emerald-300` -- Available
  - `bg-red-50 border-red-300` -- Booked
  - `bg-amber-50 border-amber-300` -- Expiring Soon (end_date within 7 days)
  - `bg-gray-100 border-gray-300` -- Blocked

Click opens the right-side Sheet.

---

### 4. Table View (Secondary)

Compact table with `text-xs`, sticky header, alternating row backgrounds:

| Seat | Room | Category | Status | Price | End Date | Actions |
|------|------|----------|--------|-------|----------|---------|

Actions column: availability toggle + price edit buttons.

---

### 5. Right-Side Booking/Details Sheet

Opens via `Sheet` component (side="right", ~400px wide).

**If seat is Booked:**
- Student profile: name, phone, email, serial number, course, college, address
- Current booking dates, duration, amount, payment status
- All bookings table (current + future)

**If seat is Available:**
- "Book Seat" section:
  - Student search (search profiles by name/phone/email)
  - "Add New Student" link
  - Plan selection: Monthly / 15 Days / Custom
  - Start date (default: selected date from filter)
  - Auto-calculated end date
  - Previous booking history for this seat
  - Confirm Booking button
- Pre-booking validation checks:
  - No active booking on seat for selected date
  - Seat is not blocked
  - Query bookings table to confirm no overlap

**If seat is Blocked:**
- Show blocked status, option to unblock

---

### 6. Date-Aware Logic

When the date picker changes:
1. Fetch all bookings where `start_date <= selectedDate AND end_date >= selectedDate` for the selected cabin's seats
2. Recalculate each seat's status:
   - **Booked**: has active booking covering selected date
   - **Expiring Soon**: has booking where `end_date` is within 7 days after selected date
   - **Blocked**: `is_available = false`
   - **Available**: none of the above
3. Update stats bar counts
4. Re-render grid instantly (no page reload)

---

### 7. Service Updates

**File: `src/api/vendorSeatsService.ts`**
- Add `getSeatsForDate(cabinId, date)` method that fetches seats + bookings for a specific date
- Add `createPartnerBooking(data)` method for partner-initiated bookings (inserts into bookings table with the selected student's user_id)
- Add `searchStudents(query)` method to search profiles by name/phone/email
- Update status filter to support 'expiring_soon' and 'blocked'

---

### Technical Summary

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Full rewrite: stats bar, sticky filters, grid/table views, Sheet drawer with booking form, date-aware logic |
| `src/api/vendorSeatsService.ts` | Add `getSeatsForDate`, `createPartnerBooking`, `searchStudents` methods; update `SeatFilters` interface |

### Design Principles Applied
- Maximum data density: 10-15 seats visible per row
- No card wrappers on grid
- All text 10-12px
- Padding reduced to 1-2 units
- Sticky filter bar
- Desktop-first responsive grid
- Airline-style seat selection UX
- Color-coded status at a glance
- Right-drawer for details (no dialogs/modals blocking the grid)

