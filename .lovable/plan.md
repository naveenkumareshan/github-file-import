

## Enhancements: Resize Handles, Color Themes, Background Image Upload, Remove Structures

### 1. Drag-to-Resize Handles on Sections

Add visual resize handles on the 4 corners and 4 edges of each section. When the admin drags a handle, the section width/height updates in real-time. Seats outside the new boundary are auto-removed.

**Implementation in FloorPlanDesigner.tsx:**
- Add 8 invisible resize handles (corner + edge) rendered as small squares on each section
- Track `resizingSection` state with the handle direction (e.g. `se`, `nw`, `e`, `s`)
- On mouse move during resize, calculate new width/height/position based on handle direction
- Snap to grid, enforce minimum size (100x80), clamp within room boundaries
- After resize completes (mouse up), auto-remove seats outside new boundary

### 2. Color-Coded Section Themes

Add a color picker to the Section Editor dialog so each seat section gets a distinct color theme.

**Predefined color themes:**
- Blue (default), Green, Purple, Orange, Teal, Rose, Amber, Indigo

Each theme sets: border color, header background, and a subtle body tint. Stored as `color` field in the Section type (already exists).

**Changes:**
- Add color selector (grid of color swatches) in SectionEditorDialog
- Apply color to section border, header bg, and seat border colors on the canvas
- Update legend to show section names with their colors

### 3. Remove "Add Structure" Option

Remove the "Add Structure" button from the toolbar and the structural dialog entirely. Remove `STRUCTURAL_TYPES`, `STRUCTURAL_COLORS`, and the structural dialog. Keep the structural rendering code for backward compatibility with existing data but remove the ability to create new ones.

### 4. Background Layout Image Upload

Allow admin to upload a floor plan image (JPG/PNG) as a background overlay on the canvas. Sections and seats are then placed on top of this image for easy reference.

**Implementation:**
- Add "Upload Layout" button to the toolbar
- Use a hidden file input to accept image uploads
- Store the image as a data URL in the cabin's layout config (new `layoutImage` field in cabins table or store in `room_elements` JSON)
- Render the image as a background `<img>` inside the canvas div, sized to `roomWidth x roomHeight`
- Add opacity slider to control image transparency (default 30%)
- Add "Remove Layout" button to clear the background image
- Store in cabins table as a new `layout_image` text column (base64 or storage URL)

**Database change:**
```sql
ALTER TABLE cabins ADD COLUMN layout_image text;
```

### Technical Details

#### FloorPlanDesigner.tsx

**New state:**
- `resizingSection: { id: string; handle: string; startX: number; startY: number; startW: number; startH: number; startPosX: number; startPosY: number } | null`
- `layoutImageOpacity: number` (0-100, default 30)

**Resize handle positions (relative to section):**
```text
[nw]----[n]----[ne]
 |               |
[w]             [e]
 |               |
[sw]----[s]----[se]
```

Each handle is a 8x8 transparent div with appropriate cursor style (nw-resize, e-resize, etc). On mousedown, set `resizingSection`. On mousemove, compute delta and adjust section dimensions. On mouseup, finalize and remove out-of-bounds seats.

**Color themes map:**
```typescript
const SECTION_COLORS = {
  blue: { border: 'border-blue-400', header: 'bg-blue-100', seat: 'border-blue-400 bg-blue-50' },
  green: { border: 'border-emerald-400', header: 'bg-emerald-100', seat: 'border-emerald-400 bg-emerald-50' },
  purple: { border: 'border-purple-400', header: 'bg-purple-100', seat: 'border-purple-400 bg-purple-50' },
  // ... more colors
};
```

**Background image:** Rendered as first child inside the canvas div, absolutely positioned, with configurable opacity.

#### SectionEditorDialog

- Add color picker grid below section name
- Remove structural label selector (kept for existing data only)

#### adminCabinsService.ts

- `updateCabinLayout` accepts optional `layoutImage` parameter
- Saves to new `layout_image` column

#### SeatManagement.tsx

- Add `layoutImage` state, pass to FloorPlanDesigner
- Handle image upload (convert to base64 or upload to storage bucket)
- Save/load layout image with cabin data

### Files Summary

| File | Action |
|---|---|
| Database migration | Add `layout_image` text column to `cabins` |
| `src/components/seats/FloorPlanDesigner.tsx` | Add resize handles, color themes, background image, remove Add Structure button |
| `src/pages/SeatManagement.tsx` | Handle layout image state, pass to designer |
| `src/api/adminCabinsService.ts` | Save/load `layout_image` |

