

## Compact Booking Cards + Profile Header Redesign + Reading Room Visibility Fix

### 1. Compact Booking Card in StudentBookings

**Problem**: The booking card is too tall. The "Booking Validity" section uses a full `Card > CardHeader > CardContent` with large text, a separate status message box, and excessive spacing. Combined with the dates grid and action buttons, each card takes up nearly the full screen.

**Solution**: Replace the `BookingExpiryDetails` component usage in `BookingsList.tsx` with a compact inline validity bar. Merge key info into a single dense card.

**New card layout:**
```text
+----------------------------------------------+
| [img] Sunrise Study Hub  Seat #46    [Paid]  |
|       24 Feb - 23 Mar 2026   Rs.2,500         |
|       [Active - 26 days remaining]            |
|       [View Details]  [Renew Booking]         |
+----------------------------------------------+
```

**Changes in `BookingsList.tsx`:**
- Remove the `BookingExpiryDetails` card component call (lines 252-259)
- Replace with a single-line inline validity indicator: a small colored bar showing status badge + days remaining text, no card wrapper
- Collapse the 2-col dates grid into a single line: "24 Feb - 23 Mar 2026"
- Move amount to the top row next to the title
- Remove the separate "Booked On" field (less important for students)
- Keep View Details and Renew buttons but make them full-width side-by-side

**Files**: `src/components/booking/BookingsList.tsx`

---

### 2. Profile Header -- Show Name, Phone, Email, Photo Edit; Collapse Info Sections

**Problem**: The profile card shows name and email at the top, then immediately lists Account Info, Personal Info, Academic Info, Security as always-visible navigation rows. The user wants phone number and a photo edit button visible in the header, and the 4 info sections hidden behind a collapsible arrow.

**Solution**: Restructure the profile header card:

**New layout:**
```text
+----------------------------------+
| [Avatar] [Edit icon]             |
|  Name                            |
|  email@example.com               |
|  +91 9876543210                  |
|                                  |
|  More Info                   v   |  <-- collapsible toggle
|  +--------------------------+    |
|  | > Account Info        >  |    |
|  | > Personal Info       >  |    |
|  | > Academic Info       >  |    |
|  | > Security            >  |    |
|  +--------------------------+    |
+----------------------------------+
```

**Changes in `ProfileManagement.tsx`:**
- Add phone number display below email in the avatar section
- Add a small edit/pencil icon button on the avatar that opens the Account Info sheet (for photo upload)
- Wrap the SECTIONS navigation rows in a `Collapsible` component (from `@radix-ui/react-collapsible`)
- Add a "More Info" toggle button with a chevron-down arrow that expands/collapses the 4 section rows
- Default state: collapsed (sections hidden)

**Files**: `src/components/profile/ProfileManagement.tsx`

---

### 3. Newly Added Reading Room Not Visible

**Problem**: The student cannot see a newly added reading room. Investigation shows the room "TRINI STUDY SPACE" exists in the database but has `is_active: false`, so it's correctly filtered out by the `cabinsService.getAllCabins()` query which only returns `is_active: true` rooms.

**Root cause**: The admin/partner who created the room either explicitly set it to inactive or there was a UI issue during creation. The code logic is correct -- `is_active` defaults to `true` in both the database schema and the admin creation form.

**Solution**: No code change needed for the filtering logic. However, to prevent confusion, add a visual indicator in the admin cabin creation flow. After saving a new cabin, if the cabin is created with `is_active: false`, show a warning toast: "Room created but set to inactive. Students won't see it until you activate it."

Also ensure the admin cabin list clearly shows the active/inactive status so the partner can toggle it.

**Files**: `src/api/adminCabinsService.ts` (add post-creation check), `src/components/admin/CabinForm.tsx` (add warning)

---

### Technical Summary

| Change | Files |
|---|---|
| Compact booking card -- inline validity, dense layout | `src/components/booking/BookingsList.tsx` |
| Profile header -- phone, edit icon, collapsible sections | `src/components/profile/ProfileManagement.tsx` |
| Reading room visibility -- warning toast on inactive creation | `src/components/admin/CabinForm.tsx` |

