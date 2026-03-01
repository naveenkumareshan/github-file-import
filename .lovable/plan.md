

## Show Bed Counts, Remove Grid Blocking, and Add Bed Shape Design with Rotation

### 1. Show bed counts on floor tabs and total

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

- **Total beds summary**: Add a summary line above the floor tabs showing total beds across all floors (e.g., "Total: 24 beds (18 available)")
- **Floor tab bed counts**: Compute bed count per floor from `floorData` and append it to each floor tab label (e.g., "Ground Floor (8)")

### 2. Remove blocking from the edit dialog (grid) -- only allow from bed map

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

- Remove the "Block Reason" input, the "Block/Unblock" button, and the `<Separator>` before it from the Edit Bed Dialog (lines 1001-1008)
- Keep `handleToggleBlock` function for use by the bed map only
- The bed map (Layout Plan) already supports clicking a bed and editing -- blocking should be accessible only there

### 3. Add bed shape SVG design to both grid cards and layout plan, with rotation support

**Database migration**: Add `rotation` integer column (default 0) to `hostel_beds` table to store bed orientation (0, 90, 180, 270 degrees)

**New component: `src/components/hostels/BedShapeIcon.tsx`**
- Create an SVG bed shape (top-down view: rectangle with rounded headboard, pillow indicator, and mattress lines) 
- Accept props: `width`, `height`, `rotation` (0/90/180/270), `status` (available/occupied/blocked/selected), `bedNumber`
- Apply `transform: rotate()` based on rotation value
- Use status-based coloring (emerald for available, blue for occupied, red for blocked)

**File: `src/pages/admin/HostelBedManagementPage.tsx`**
- Replace the plain colored `<div>` in bed grid cards with the new `BedShapeIcon` component (small version, ~40x50px)
- Update `DesignerBed` interface and data loading to include `rotation` field

**File: `src/components/hostels/HostelBedPlanDesigner.tsx`**
- Replace the plain rectangle bed rendering (lines 288-295) with `BedShapeIcon` (larger version, ~50x60px)
- Increase `BED_W` and `BED_H` slightly to accommodate the bed shape
- Add a rotate button that appears on hover/selection -- clicking it cycles through 0 -> 90 -> 180 -> 270 -> 0
- Pass rotation to `onBedMove` or add a new `onBedRotate` callback
- Update `DesignerBed` interface to include `rotation: number`

**File: `src/pages/admin/HostelBedManagementPage.tsx`**
- Add `handleBedRotate` handler that updates the bed's rotation in the database
- Save rotation along with position in `handleSaveLayout`
- Load rotation from DB in `loadDesignerData`

### Technical Details

**BedShapeIcon SVG design** (top-down view):
```text
+------------------+
|   [  pillow  ]   |  <- headboard end (rounded top)
|                  |
|   ............   |  <- mattress texture lines
|   ............   |
|                  |
+------------------+  <- foot end
```

- Headboard: slightly thicker top edge with rounded corners
- Pillow: small rounded rectangle near the top
- Body: clean rectangle with subtle inner line for mattress
- Bed number displayed in the center

**Rotation in layout**: Each bed stores its rotation angle. On the canvas, `transform: rotate(Xdeg)` is applied around the bed's center. A small circular rotate icon button appears on hover, cycling through 90-degree increments.

