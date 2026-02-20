
## Rename "Cabin/Cabins" → "Reading Room/Reading Rooms" Across All UI

### Scope of Change

This is a **UI-only text rename** — no routes, API calls, variable names, or database fields change. Only what users **see** on screen changes. This affects 15 files.

---

### Rule Applied Everywhere

| Old text | New text |
|---|---|
| "Cabin" (standalone noun) | "Reading Room" |
| "Cabins" (plural noun) | "Reading Rooms" |
| "cabin" (lowercase label) | "reading room" |
| "cabins" (lowercase plural) | "reading rooms" |
| "No cabins found" | "No reading rooms found" |
| "Browse Cabins" | "Browse Reading Rooms" |
| "Select cabin" | "Select reading room" |
| "All Cabins" | "All Reading Rooms" |
| "Target Cabin" | "Target Reading Room" |
| "Cabin Seat Booking Reports" | "Reading Room Seat Booking Reports" |
| "reading cabin" | "reading room" |
| "active cabin subscriptions" | "active reading room subscriptions" |
| "Standard Cabin" | "Standard Reading Room" |

---

### Files to Edit (UI text only, no logic changes)

#### Student-facing pages

**1. `src/pages/StudentDashboard.tsx`**
- `"Browse Cabins"` button → `"Browse Reading Rooms"`
- `"Book New Cabin"` button → `"Book New Reading Room"`

**2. `src/pages/Confirmation.tsx`**
- `"Your reading cabin has been successfully reserved."` → `"Your reading room has been successfully reserved."`
- Label `"Cabin"` showing cabin name → `"Reading Room"`
- Label `"cabinCode"` → `"Room Code"`

**3. `src/components/dashboard/SubscriptionCard.tsx`**
- `"Your active cabin subscriptions"` → `"Your active reading room subscriptions"`
- `"Standard Cabin"` → `"Standard Reading Room"`

**4. `src/components/EditSeatView.tsx`**
- `"Non AC Cabin"` → `"Non AC Room"` and `"AC Cabin"` → `"AC Room"` (in description text)

---

#### Admin panel pages

**5. `src/pages/AdminBookingDetail.tsx`**
- `'Cabin'` in breadcrumb subtitle `"Cabin Booking #..."` → `"Reading Room Booking #..."`

**6. `src/pages/RoomManagement.tsx`**
- `'No cabins found matching your criteria.'` → `'No reading rooms found matching your criteria.'`
- `'No cabins found. Add your first cabin!'` → `'No reading rooms found. Add your first reading room!'`
- `"Cabin deleted successfully"` → `"Reading Room deleted successfully"`
- `"Cabin updated successfully"` / `"Cabin created successfully"` → `"Reading Room updated/created successfully"`
- `"Are you sure you want to delete this cabin?"` → `"...this reading room?"`
- `"Failed to delete cabin"` / `"Failed to fetch cabins"` toast messages → reading room equivalent

**7. `src/components/admin/reports/BookingReportsPage.tsx`**
- `"Cabin Seat Booking Reports"` → `"Reading Room Seat Booking Reports"`

**8. `src/components/admin/reports/BookingTransactions.tsx`**
- Filter dropdown `<SelectItem value="cabin">Cabin</SelectItem>` → label `"Reading Room"` (value stays `"cabin"` — it's an API filter key)

**9. `src/components/admin/SeatTransferManagement.tsx`**
- `<Label htmlFor="cabin">Cabin</Label>` → `"Reading Room"`
- `<SelectValue placeholder="All cabins" />` → `"All reading rooms"`
- `<SelectItem value="all">All Cabins</SelectItem>` → `"All Reading Rooms"`
- `"Please select target cabin and seat"` toast → `"...reading room..."`
- `<Label htmlFor="target-cabin">Target Cabin</Label>` → `"Target Reading Room"`
- `<SelectValue placeholder="Select target cabin" />` → `"Select target reading room"`
- `<strong>Cabin:</strong>` label in booking row → `"Reading Room:"`
- `"Transferred From : ..."` row — `Canin Code :` (typo) → `Room Code:`
- CSV export header `'Cabin'` column → `'Reading Room'`

**10. `src/components/admin/SeatTransferManagementHistory.tsx`**
- Same set as above: `"Cabin"` label, `"All cabins"`, `"All Cabins"`, `"Cabin:"` row text, `Canin Code :` (typo fix) → `"Reading Room:"`/`"Room Code:"`
- CSV export header `'Cabin'` → `'Reading Room'`

**11. `src/components/admin/BookingCalendarDashboard.tsx`**
- `<SelectValue placeholder="Select cabin" />` → `"Select reading room"`
- `<SelectItem value="all">All Cabins</SelectItem>` → `"All Reading Rooms"`

**12. `src/components/admin/reports/BookingReportsPage.tsx`** (already listed above)

---

#### Host/Vendor pages

**13. `src/pages/vendor/VendorRegister.tsx`**
- `<option value="cabin">Cabin</option>` display label → `"Reading Room"` (value stays `"cabin"`)

---

#### Shared/common components

**14. `src/components/cabins/CabinsHeader.tsx`**
- Already says "Reading Rooms" in the `<h1>` — confirm no remaining "cabin" text. (Already correct — no change needed.)

**15. `src/components/admin/NotificationManagement.tsx`**
- Placeholder text: `"Book any cabin and get 20% off..."` → `"Book any reading room and get 20% off..."`

---

### What is NOT changed (intentional)

- **Variable names**: `cabin`, `cabins`, `setCabins`, `cabinId`, etc. — internal JS variables, no user impact
- **CSS class names**: `text-cabin-dark`, `bg-cabin-light` — Tailwind theme tokens, not visible text
- **API/route values**: `value="cabin"` in select items that are filter API params — the label changes but the value stays so API calls don't break
- **File/component names**: `CabinCard.tsx`, `cabinsService.ts` etc. — internal code names
- **Database fields**: `cabin_id`, `cabinCode` — backend fields stay the same
- **Backend folder/code** — not touched at all
