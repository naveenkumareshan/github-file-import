

## Redesign: Professional Floor-Plan Based Seating Designer

This is a major redesign of the Room Layout & Seat Management system, replacing the current free-floating icon canvas with a structured, professional floor-plan editor with walls, grid snapping, auto-generation, and real booking integration.

### What Changes

The current system has two separate sections (RoomElementPositioner for layout elements + SeatMapEditor for seats) with free-floating placement on a plain grey canvas. This will be unified into a single structured room designer with visible walls, a snap grid, and an auto seat generator.

### Architecture

**New Components:**
- `src/components/seats/FloorPlanDesigner.tsx` -- The main admin designer component (replaces both RoomElementPositioner and SeatMapEditor on the SeatManagement page)
- `src/components/seats/FloorPlanViewer.tsx` -- Read-only student view (replaces SeatGridMap in the booking flow)
- `src/components/seats/AutoSeatGenerator.tsx` -- Dialog/panel for auto-generating classroom-style seat layouts
- `src/components/seats/RoomWalls.tsx` -- SVG-based room boundary renderer with wall edges
- `src/components/seats/GridOverlay.tsx` -- Configurable grid overlay for snap alignment

**Modified Files:**
- `src/pages/SeatManagement.tsx` -- Replace RoomElementPositioner + SeatMapEditor with single FloorPlanDesigner
- `src/components/seats/DateBasedSeatMap.tsx` -- Use FloorPlanViewer instead of SeatGridMap
- `src/components/seats/SeatBookingForm.tsx` -- Minor: pass room dimensions to DateBasedSeatMap
- `src/api/adminCabinsService.ts` -- Update layout save to include room dimensions

**Database Changes:**
- Add `room_width` (integer, default 800) and `room_height` (integer, default 600) columns to `cabins` table
- Add `grid_size` (integer, default 20) column to `cabins` table
- Add `row` and `col` (integer) columns to `seats` table for structured seat positioning

**Removed (replaced):**
- `src/components/admin/RoomElementPositioner.tsx` -- Functionality absorbed into FloorPlanDesigner
- `src/components/seats/SeatGridMap.tsx` -- Replaced by FloorPlanViewer

---

### Technical Details

#### 1. Room Boundary System (RoomWalls.tsx)

An SVG-based component that renders 4 visible walls as thick bordered lines around the room area. Admin can configure room width (400-1600px) and height (300-1200px) via input fields. All content is clipped inside the room boundary -- nothing can be placed outside.

```text
+------ Room (configurable W x H) ------+
|  [Door]                        [Window]|
|                                        |
|   [1] [2] [3] [4]    [5] [6] [7] [8]  |
|   [9] [10][11][12]   [13][14][15][16]  |
|                                        |
|  [AC]                        [Screen]  |
+----------------------------------------+
```

#### 2. Grid System (GridOverlay.tsx)

- Renders a dot or line grid inside the room boundaries
- Configurable grid size (10px, 20px, 40px)
- All elements and seats snap to grid intersections on drag
- Snap formula: `Math.round(pos / gridSize) * gridSize`
- Grid can be toggled on/off via a toolbar button

#### 3. FloorPlanDesigner.tsx (Admin Editor)

The unified editor component with:

**Toolbar:** Room dimensions inputs | Grid toggle | Element buttons (Door, Bath, Window, Screen, AC) | Auto Generate Seats | Save Layout

**Canvas:** SVG/div-based room with:
- Visible wall borders (4px solid border)
- Optional grid overlay
- Draggable room elements (snapped to grid, constrained to room boundary)
- Draggable seats (snapped to grid, constrained to room boundary)
- Overlap detection: warn if seat placed on another seat's position

**Element Placement Rules:**
- Door/Window: constrained to wall edges (position.y === 0 or position.y === roomHeight or position.x === 0 or position.x === roomWidth)
- Screen: constrained to top wall (position.y near 0)
- AC: constrained to top wall
- Bath: constrained to corners or wall edges

**Seat Properties Panel (right side or bottom):** When a seat is selected, show its number, row, column, price, availability toggle, and delete button.

**State Management:** All positions stored as grid-snapped coordinates. On save, the structured JSON is sent to the backend:
```json
{
  "room_width": 800,
  "room_height": 600,
  "grid_size": 20,
  "room_elements": [{"id": "door-1", "type": "door", "position": {"x": 0, "y": 200}}],
  "seats": [{"id": "...", "number": 1, "row": 0, "col": 0, "position": {"x": 60, "y": 100}}]
}
```

#### 4. Auto Seat Generator (AutoSeatGenerator.tsx)

A dialog that accepts:
- Number of rows (e.g., 5)
- Seats per row (e.g., 8)
- Aisle after X seats (e.g., 4 -- creates a gap)
- Seat spacing (pixels, default 50)
- Starting price (per seat)

Generates a classroom-style layout:
```text
Row 1:  [1] [2] [3] [4]  ___  [5] [6] [7] [8]
Row 2:  [9] [10][11][12]  ___  [13][14][15][16]
...
```

After generation, seats appear in the canvas and can be manually repositioned by dragging. The generated seats are created in the database via `adminSeatsService.bulkCreateSeats`.

#### 5. FloorPlanViewer.tsx (Student View)

Read-only version of the floor plan that:
- Shows room walls and elements (non-interactive)
- Displays seats with booking-aware coloring:
  - Green: Available (clickable)
  - Red: Booked (disabled, tooltip shows booking info)
  - Grey: Blocked by admin
  - Blue outline: Currently selected
- On seat click, calls `onSeatSelect` to proceed to booking
- Supports zoom via CSS transform scale (buttons: zoom in, zoom out, fit-to-screen)
- Supports pan via mouse drag on the background (transform translate)

This replaces `SeatGridMap` in `DateBasedSeatMap.tsx`.

#### 6. Zoom & Pan Controls

Both FloorPlanDesigner and FloorPlanViewer include:
- Zoom in/out buttons (+/- or mouse wheel)
- Fit to screen button (calculates scale to fit room in viewport)
- Pan by dragging the background
- Implemented via CSS `transform: scale(zoom) translate(panX, panY)` on the room container
- Zoom range: 0.25x to 3x

#### 7. Database Migration

```sql
ALTER TABLE cabins ADD COLUMN room_width integer NOT NULL DEFAULT 800;
ALTER TABLE cabins ADD COLUMN room_height integer NOT NULL DEFAULT 600;
ALTER TABLE cabins ADD COLUMN grid_size integer NOT NULL DEFAULT 20;

ALTER TABLE seats ADD COLUMN row_index integer NOT NULL DEFAULT 0;
ALTER TABLE seats ADD COLUMN col_index integer NOT NULL DEFAULT 0;
```

#### 8. Save Flow

When admin clicks "Save Layout":
1. Update `cabins` table: `room_width`, `room_height`, `grid_size`, `room_elements` (JSONB)
2. For each seat: update `position_x`, `position_y`, `row_index`, `col_index` via `adminSeatsService.updateSeatPositions`
3. Toast confirmation on success

#### 9. Integration with SeatManagement.tsx

The current page structure:
- Card 1: Room Layout & Elements (RoomElementPositioner) -- REMOVED
- Card 2: Seat Management (floors, add seats, SeatMapEditor) -- RESTRUCTURED

New structure:
- Card 1: Room Settings (dimensions, grid size, floor selector)
- Card 2: FloorPlanDesigner (unified canvas with elements + seats + auto-generate)
- Seat details panel below or beside the canvas

#### 10. Booking Integration (already working)

The existing flow: seat click -> DateBasedSeatMap -> SeatBookingForm -> create booking -> payment remains unchanged. The only change is replacing SeatGridMap with FloorPlanViewer inside DateBasedSeatMap for a more professional visual.

---

### Files Summary

| File | Action |
|---|---|
| Database migration | New: add room dimensions to cabins, row/col to seats |
| `src/components/seats/FloorPlanDesigner.tsx` | New: unified admin editor |
| `src/components/seats/FloorPlanViewer.tsx` | New: read-only student view |
| `src/components/seats/AutoSeatGenerator.tsx` | New: auto seat generation dialog |
| `src/components/seats/RoomWalls.tsx` | New: SVG room boundary renderer |
| `src/components/seats/GridOverlay.tsx` | New: grid overlay component |
| `src/pages/SeatManagement.tsx` | Rewrite: use FloorPlanDesigner |
| `src/components/seats/DateBasedSeatMap.tsx` | Edit: use FloorPlanViewer |
| `src/api/adminCabinsService.ts` | Edit: save room dimensions |

### What Stays the Same

- Booking flow (SeatBookingForm, RazorpayCheckout)
- Database `seats` table structure (adding columns, not changing existing)
- Floor management system
- All API services for seat CRUD

