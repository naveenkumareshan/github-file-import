

## Redesign Hostel Management to Match Reading Room UI

### Overview
Replace the current table-based hostel management page with a card-grid layout matching the Reading Room (CabinItem + CabinEditor) pattern. Add activate/deactivate, booking pause, bed map access, and an inline accordion-based hostel editor.

### 1. Database Migration
Add `is_booking_active` column to the `hostels` table (matches `cabins.is_booking_active`):
- `is_booking_active` (boolean, default true) -- controls whether students can book

### 2. New Component: HostelItem Card
Create `src/components/admin/HostelItem.tsx` mirroring `CabinItem.tsx`:
- Card with hostel logo/image, name, serial number, gender badge, location
- Status badges: Active/Inactive, Booking On/Off, Approved/Pending
- Action buttons: Edit, Beds (navigate to bed map), Packages, Activate/Deactivate, Pause/Enable Booking, Delete
- Same visual style: rounded-xl card, aspect-video image, hover effects, compact action row

### 3. New Component: HostelEditor (Inline Accordion)
Create `src/components/admin/HostelEditor.tsx` mirroring `CabinEditor.tsx`:
- Replace the current dialog-based `HostelForm` with a full-page accordion editor
- Sections (collapsible, one open at a time):
  1. Basic Information (name, description, gender, stay type, capacity)
  2. Images (logo + gallery upload)
  3. Pricing & Deposit (security deposit)
  4. Booking Configuration (allowed durations, max advance days, advance payment settings, advance applicable durations)
  5. Amenities (checkbox grid)
  6. Contact (email, phone)
  7. Partner Assignment (admin selects partner, partner sees own details)
  8. Location (address, state/city/area selector, map picker)
- Sticky footer with Save and Cancel buttons
- Reuses existing `ImageUpload`, `LocationSelector`, `MapPicker` components

### 4. Rewrite HostelManagement Page
Update `src/pages/hotelManager/HostelManagement.tsx`:
- Replace table layout with card grid (3 columns on desktop, same as RoomManagement)
- Add search bar and pagination (same pattern as RoomManagement)
- Toggle between grid view and inline editor (same `showEditor` state pattern)
- Wire up toggle handlers:
  - `handleToggleActive`: update `is_active` on hostels table (+ auto-disable `is_booking_active` when deactivating)
  - `handleToggleBooking`: update `is_booking_active` on hostels table
  - `handleManageBeds`: navigate to `/admin/hostels/{id}/rooms` (existing route)

### 5. Hostel Service Updates
Add to `src/api/hostelService.ts` (or a new `hostelAdminService.ts`):
- `toggleHostelActive(id, isActive)` -- updates `is_active` (and `is_booking_active` if deactivating)
- `toggleHostelBooking(id, isBookingActive)` -- updates `is_booking_active`

### 6. Types Update
The migration will auto-update `types.ts` to include `is_booking_active` on the hostels table.

### Files Changed

| File | Action | Description |
|---|---|---|
| Database migration | New | Add `is_booking_active` to `hostels` |
| `src/components/admin/HostelItem.tsx` | New | Card component matching CabinItem |
| `src/components/admin/HostelEditor.tsx` | New | Accordion editor matching CabinEditor |
| `src/pages/hotelManager/HostelManagement.tsx` | Rewrite | Card grid + inline editor, toggle handlers |
| `src/api/hostelService.ts` | Edit | Add toggleActive, toggleBooking methods |

### Visual Layout (Grid View)

```text
[Search bar________________________]

[Hostel Card 1]  [Hostel Card 2]  [Hostel Card 3]
  [image]          [image]          [image]
  [name]           [name]           [name]
  [location]       [location]       [location]
  [price/gender]   [price/gender]   [price/gender]
  [Edit] [Beds] [Activate] [Pause]  ...

Showing 1-9 of 12   [< Prev] [1] [2] [Next >]
```

### Visual Layout (Editor View)

```text
[<- Back to Dashboard]     [Edit Hostel Name]

[1] Basic Information          [v]
[2] Images                     [>]
[3] Pricing & Deposit          [>]
[4] Booking Configuration      [>]
[5] Amenities                  [>]
[6] Contact                    [>]
[7] Partner Assignment         [>]
[8] Location                   [>]

            [sticky: Cancel] [Save]
```

