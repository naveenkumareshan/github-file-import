

## Create Hostel Bed Map -- Same as Seat Map with All Admin Features

### Overview
Build a comprehensive hostel bed management page mirroring the reading room seat management system. This includes both the box grid layout and the visual floor plan (thread-line) layout, plus all admin operations: book future, block/unblock, edit, transfer bed, and view details.

### Database Migration

Add position and layout columns to support the visual floor plan view:

**`hostel_beds` table** -- add:
- `position_x` (numeric, default 0) -- x coordinate on room layout
- `position_y` (numeric, default 0) -- y coordinate on room layout

**`hostel_rooms` table** -- add:
- `room_width` (integer, default 800) -- canvas width for visual layout
- `room_height` (integer, default 600) -- canvas height for visual layout
- `layout_image` (text, nullable) -- background image for room layout
- `layout_image_opacity` (integer, default 30) -- opacity of background image

### New Components

#### 1. `HostelBedPlanDesigner.tsx` (mirrors `FloorPlanDesigner.tsx`)
- Visual canvas where admin clicks to place bed markers on a room layout
- Drag to reposition beds, snap to 40px grid, collision detection
- Toolbar: upload layout image, opacity slider, place beds mode, zoom, save
- Click a bed marker to open edit dialog (category, price override, block/unblock)
- Delete bed via hover X button
- Same zoom/pan/minimap controls as FloorPlanDesigner

#### 2. `HostelBedPlanViewer.tsx` (mirrors `FloorPlanViewer.tsx`)
- Read-only viewer showing bed markers on the room layout
- Color-coded: emerald=available, blue=occupied, red=blocked, primary=selected
- Tooltip on hover with bed details (number, sharing type, category, price, occupant)
- Zoom/pan controls and minimap
- Used in the date-based bed map and student-facing views

#### 3. `DateBasedBedMap.tsx` (mirrors `DateBasedSeatMap.tsx`)
- Date range picker (start/end) to check bed availability for specific periods
- Queries `hostel_bookings` for overlapping confirmed/pending bookings
- Shows available/unavailable counts with badges
- Floor selector pills (same style as reading room)
- Room selector within each floor
- Renders `HostelBedPlanViewer` with availability data overlaid
- Export CSV button for availability data
- Shows conflicting booking details when a bed is selected

#### 4. `HostelBedDetailsDialog.tsx` (mirrors `SeatDetailsDialog.tsx`)
- Dialog showing all booking details for a specific bed
- Table: Guest name, contact, booking dates, price, status
- Shows booking history
- Export data button

#### 5. `HostelBedTransferManagement.tsx` (mirrors `SeatTransferManagement.tsx`)
- Lists all confirmed hostel bookings with bed assignments
- Search, filter by hostel, sort, pagination
- Transfer dialog: select target hostel, room, and available bed
- Updates booking's `bed_id`, `room_id` (and `hostel_id` if cross-hostel)
- Export CSV/Excel

### Updated Page: `HostelBedManagementPage.tsx`

New page at route `/admin/hostels/:hostelId/beds` (mirrors `SeatManagement` at `/admin/cabins/:cabinId/seats`).

```text
[< Back]  Hostel Name  |  Gender  |  Capacity

[Categories]                    |  [Rooms/Floors]
  AC +500  [Edit] [Delete]      |  Floor 1  Floor 2  Floor 3
  Non-AC +0 [Edit] [Delete]     |
  [+ Add]                       |

[View Toggle: Box Grid | Floor Plan]

--- Box Grid View (enhanced existing HostelBedMapEditor) ---
Room 101 [Standard]        3/6 available
[===---] progress bar
[Bed 1] [Bed 2] [Bed 3] [Bed 4] [Bed 5] [Bed 6]
  Click any bed -> opens action menu:
  - Edit (category, price override)
  - Block/Unblock
  - View Details (booking history)
  - Book Future (opens manual booking)
  - Transfer (if occupied)

--- Floor Plan View (new visual layout) ---
Per-room canvas with bed markers positioned via drag-and-drop
Same FloorPlanDesigner toolbar (upload layout, place beds, zoom)
```

### Tabs on the Management Page

| Tab | Description |
|---|---|
| Bed Map | Box grid + Floor plan toggle (default) |
| Date Availability | DateBasedBedMap with date range picker |
| Transfer Beds | HostelBedTransferManagement |

### Admin Action Flows

**Book Future**: From bed details, admin clicks "Book Future" which navigates to ManualBookingManagement with hostel/room/bed pre-selected (reuse existing manual booking flow with hostel mode).

**Block/Unblock**: Same as current HostelBedMapEditor -- toggle `is_blocked` with reason. Enhanced with date-range blocking support.

**Edit**: Dialog to change category, price override, sharing option assignment.

**Transfer Bed**: Dialog to pick target hostel/room/bed. Updates `hostel_bookings.bed_id` and `room_id`. Marks old bed available, new bed occupied.

**View Details**: Dialog showing bed info + all booking history (past and current).

### Route Changes in `App.tsx`

Add new route under admin:
```
<Route path="hostels/:hostelId/beds" element={<HostelBedManagementPage />} />
```

### Files to Create/Modify

| File | Action | Description |
|---|---|---|
| Database migration | New | Add position columns to hostel_beds, layout columns to hostel_rooms |
| `src/components/hostels/HostelBedPlanDesigner.tsx` | New | Visual bed layout editor (mirrors FloorPlanDesigner) |
| `src/components/hostels/HostelBedPlanViewer.tsx` | New | Read-only bed layout viewer (mirrors FloorPlanViewer) |
| `src/components/hostels/DateBasedBedMap.tsx` | New | Date-aware bed availability map |
| `src/components/admin/HostelBedDetailsDialog.tsx` | New | Bed booking history dialog |
| `src/components/admin/HostelBedTransferManagement.tsx` | New | Bed transfer management with filters/pagination |
| `src/pages/admin/HostelBedManagementPage.tsx` | New | Main page with tabs (Bed Map, Date Availability, Transfer) |
| `src/components/hostels/HostelBedMapEditor.tsx` | Edit | Add action menu (view details, book future, transfer) to each bed |
| `src/App.tsx` | Edit | Add route for bed management page |
| `src/components/admin/HostelItem.tsx` | Edit | Update "Beds" button to navigate to new bed management route |

### Data Flow

- All hostel bed data comes from the cloud database (hostel_beds, hostel_rooms, hostel_bookings, hostel_sharing_options tables)
- No backend API needed -- all queries use the database client directly (same pattern as existing HostelBedMapEditor)
- Bed transfer updates are direct database operations with RLS policies already in place
- Position data persisted to hostel_beds for the floor plan view

