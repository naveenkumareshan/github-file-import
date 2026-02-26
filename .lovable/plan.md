

## Sidebar Reorganization: Merge Bookings into Reading Rooms, Add Hostel Booking Items

### Current Sidebar Structure
```text
- Bookings
  - All Transactions
  - Receipts
  - Key Deposits
- Hostels
  - Manage Hostels
  - Reviews
- Reading Rooms
  - Manage Rooms
  - Reviews
```

### New Sidebar Structure
```text
- Reading Rooms (renamed from "Bookings", icon: Building)
  - All Transactions
  - Receipts
  - Key Deposits
  - Manage Rooms       (moved from old "Reading Rooms")
  - Reviews            (moved from old "Reading Rooms")

- Hostels (expanded with booking items)
  - Manage Hostels
  - Hostel Bookings    (new - links to /admin/hostel-bookings)
  - Hostel Receipts    (new - links to /admin/hostel-receipts)  
  - Hostel Deposits    (new - links to /admin/hostel-deposits)
  - Reviews
```

### Changes

**File: `src/components/admin/AdminSidebar.tsx`**

1. Rename the "Bookings" parent menu item to **"Reading Rooms"** and change its icon from `Calendar` to `Building`
2. Add "Manage Rooms" (`/admin/rooms`) and "Reviews" (`/admin/reviews?module=Reading Room`) as sub-items after Key Deposits
3. Remove the separate "Reading Rooms" collapsible section entirely (lines 198-221)
4. Expand the "Hostels" section to include:
   - Hostel Bookings (`/admin/hostel-bookings`) -- existing page at `AdminHostelBookings`
   - Hostel Receipts (`/admin/hostel-receipts`) -- new placeholder or filtered receipts view
   - Hostel Deposits (`/admin/hostel-deposits`) -- new placeholder or filtered deposits view
   - Keep existing Manage Hostels and Reviews

**Note:** The Hostel Receipts and Hostel Deposits pages may not exist yet. The sidebar links will be added now; if the pages need to be created, that can be done as a follow-up. The Hostel Bookings page already exists at `/admin/hostel-bookings` (routed to `AdminHostelBookings`).

