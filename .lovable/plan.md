

## Redesign: BookMyShow-Style Section-Based Layout Designer

Transform the current individual-seat canvas into a **section-based floor plan** like the reference image, where seats are organized into named zones (e.g., "Non AC Cabins", "AC Cabins") with structural elements (Washroom, Office, Lockers) shown as labeled rectangles.

### What Changes

The current system places individual seats freely on a canvas. The new system introduces **Sections** -- named rectangular zones that contain auto-generated seat grids. Structural elements become labeled rectangles instead of small icons.

### Key Concepts

**Section (Zone):** A named rectangular area on the floor plan (e.g., "Non AC Cabins", "AC Cabins"). Each section has:
- Name/label
- Position (x, y) on the canvas
- Width and height
- Seat grid configuration (rows, columns, seat spacing)
- Seats auto-generated within the section boundary
- Section type: "seats" or "structural" (Washroom, Office, Lockers)

**Seat:** Still lives in the `seats` table, but now has a `section_id` linking it to a section. Sections own their seat arrangement.

**Structural Elements:** Washroom, Office, Lockers rendered as labeled rectangles (not small icons) matching the reference image style.

---

### Database Changes

Add a `sections` JSONB column to `cabins` table to store section definitions:

```sql
ALTER TABLE cabins ADD COLUMN sections jsonb NOT NULL DEFAULT '[]'::jsonb;
```

Each section in the JSON:
```json
{
  "id": "section-1",
  "name": "Non AC Cabins",
  "type": "seats",
  "position": { "x": 40, "y": 80 },
  "width": 500,
  "height": 350,
  "rows": 7,
  "cols": 8,
  "aisleAfterCol": 4,
  "seatSpacing": 50,
  "labelPosition": "bottom"
}
```

Structural elements stored as sections with `type: "structural"`:
```json
{
  "id": "struct-1",
  "name": "Washroom",
  "type": "structural",
  "position": { "x": 100, "y": 500 },
  "width": 150,
  "height": 100
}
```

No new tables needed -- sections are part of the cabin layout config.

---

### Component Changes

#### 1. FloorPlanDesigner.tsx (Complete Rewrite)

Replace the current individual-seat canvas with a section-based designer:

**Toolbar:**
- Room dimensions (W/H/Grid) -- keep existing
- "Add Seat Section" button -- creates a new named zone
- "Add Structure" dropdown (Washroom, Office, Lockers, Custom)
- Grid toggle, Zoom controls, Save -- keep existing

**Canvas:**
- Sections rendered as bordered rectangles with title labels
- Seats auto-generated inside each section based on rows/cols config
- Structural elements rendered as grey labeled rectangles (like the reference)
- Sections are draggable and resizable
- Section label text shown inside or below the section boundary

**Section Editor Panel (right sidebar or dialog):**
When a section is selected, show:
- Section name input
- Rows and Columns inputs
- Aisle after X seats
- Seat spacing
- Price per seat in this section
- "Regenerate Seats" button
- Delete section button

**Seat rendering within sections:**
- Seats arranged in a grid within the section boundary
- Numbered sequentially within the section
- Color-coded: green (available), teal border (like reference), red (booked), grey (blocked)
- Match the reference image's clean, compact seat blocks with numbers inside

#### 2. FloorPlanViewer.tsx (Update)

- Read sections from cabin data
- Render section boundaries with labels
- Render structural elements as labeled rectangles
- Seats clickable for booking (green = available, greyed = booked)
- Same zoom/pan controls

#### 3. AutoSeatGenerator.tsx (Remove as standalone)

Seat generation becomes part of the section creation workflow. When admin creates a section and specifies rows/cols, seats are auto-generated within that section.

#### 4. SeatManagement.tsx (Update)

- Pass sections data to FloorPlanDesigner
- Handle section CRUD operations
- Save sections to cabin `sections` column
- When a section's seat config changes, bulk create/delete seats for that section

#### 5. adminCabinsService.ts (Update)

- `updateCabinLayout` now also saves `sections` JSONB

#### 6. DateBasedSeatMap.tsx (Update)

- Pass sections data to FloorPlanViewer for proper section-based rendering

---

### Visual Design (Matching Reference Image)

```text
+================================================================+
|                                                                  |
|  +-- Non AC Cabins ---------------------------------+           |
|  | [50] [49] [36] [35]    [22] [21] [8]  [7]       |           |
|  | [51] [48] [37] [34]    [23] [20] [9]  [6]       |           |
|  | [52] [47] [38] [33]    [24] [19] [10] [5]       |           |
|  | ...                                               |           |
|  +---------------------------------------------------+           |
|                                                                  |
|  [Lockers]   +-- AC Cabins --+  +-- AC Cabins --+              |
|              | [8]  [25]     |  | [26] [43]     |              |
|              | [9]  [24]     |  | [27] [42]     |              |
|              | ...           |  | ...           |              |
|              +---------------+  +---------------+              |
|                                                                  |
|  +----------+  +----------+  +----------+                       |
|  | Washroom |  | Washroom |  |  Office  |                       |
|  +----------+  +----------+  +----------+                       |
+================================================================+
```

**Seat styling (matching reference):**
- Light background with colored border
- Seat number centered inside
- Compact size (~40x30px)
- Green/teal border for available, grey for structural areas

---

### Files Summary

| File | Action |
|---|---|
| Database migration | Add `sections` JSONB column to `cabins` |
| `src/components/seats/FloorPlanDesigner.tsx` | Major rewrite: section-based canvas |
| `src/components/seats/FloorPlanViewer.tsx` | Update: render sections and structures |
| `src/components/seats/AutoSeatGenerator.tsx` | Refactor: integrated into section creation |
| `src/components/seats/RoomWalls.tsx` | Minor update: thicker walls, no labels |
| `src/pages/SeatManagement.tsx` | Update: manage sections state |
| `src/api/adminCabinsService.ts` | Update: save sections in layout |
| `src/components/seats/DateBasedSeatMap.tsx` | Update: pass sections to viewer |

### What Stays the Same

- Database `seats` table structure (unchanged)
- Booking flow (SeatBookingForm, payment)
- Zoom/pan controls (same concept)
- Floor management system
- All seat CRUD API services

