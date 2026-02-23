

## Simplify Layout Builder + Add Seat Placement Popup with Category

### What Changes

**1. Remove unnecessary UI elements from the toolbar and canvas:**
- Remove **Width (W) and Height (H)** dimension inputs from toolbar
- Remove **"Add Seat Section"** button
- Remove **"Wall Element"** dropdown (Door, Window, Screen, AC, Bath)
- Remove **RoomWalls** component rendering (Front Wall / Back Wall labels and border)
- Remove **GridOverlay** component rendering
- Remove the **Grid toggle** button
- Remove the **section editor dialog** and all section-related rendering
- Keep: Upload Layout, Place Seats, Zoom controls, Save Layout, opacity slider

**2. Show a popup dialog every time a seat is placed:**
When the admin clicks on the canvas in placement mode, instead of immediately creating the seat, show a small dialog with:
- **Seat Number** (auto-filled, editable)
- **Category** selector: AC / Non-AC / Premium / Economy (radio group or select)
- **Price** (auto-filled from default, editable)
- Confirm / Cancel buttons

Only after the admin confirms does the seat get saved to the database.

**3. Add `category` column to seats table:**
A new text column to store the seat category (e.g., "AC", "Non-AC", "Premium").

### Technical Details

#### Database Migration
```sql
ALTER TABLE public.seats ADD COLUMN category text NOT NULL DEFAULT 'Non-AC';
```

#### `src/components/seats/FloorPlanDesigner.tsx`

**Remove from toolbar:**
- W/H dimension inputs (lines 601-608)
- Grid toggle button (lines 612-614)
- "Add Seat Section" button (lines 619-621)
- "Wall Element" dropdown (lines 624-638)
- All dividers related to removed items

**Remove from canvas rendering:**
- `<RoomWalls>` component (line 736)
- `<GridOverlay>` component (line 737)
- Wall elements rendering block (lines 740-770)
- Sections rendering block (lines 773-841)
- Section legend items (lines 899-907)
- Section editor dialog (lines 910-920)

**Remove state/logic:**
- `showGrid`, wall element dragging state, section dragging/resizing state, section editor state
- `handleAddSeatSection`, `handleAddWallElement`, `handleDeleteElement`, `constrainToWall`, resize handlers, section drag handlers
- Remove `STRUCTURAL_COLORS`, `WALL_ELEMENT_TYPES`, `WALL_ELEMENT_STYLES`, resize-related types

**Modify placement mode click handler:**
- Instead of calling `onPlaceSeat` immediately, set a `pendingSeat` state with the clicked position
- Show a `SeatPlacementDialog` with seat number, category selector, and price
- On confirm, call `onPlaceSeat` with the full details including category
- On cancel, clear `pendingSeat`

**New `SeatPlacementDialog` component (inline in same file):**
- Props: open, position, defaultNumber, defaultPrice, onConfirm, onCancel
- Fields: Seat Number (input), Category (radio group: AC, Non-AC, Premium, Economy), Price (input)
- On confirm calls back with `{ number, category, price }`

**Update `onPlaceSeat` prop signature:**
```typescript
onPlaceSeat?: (position: {x: number, y: number}, number: number, price: number, category: string) => void;
```

**Update `FloorPlanSeat` type:**
```typescript
export interface FloorPlanSeat {
  // ... existing fields
  category?: string;
}
```

#### `src/api/adminSeatsService.ts`

- Add `category` to `SeatData` interface
- Add `category` to `mapRow` function
- Add `category` to `createSeat`, `updateSeat`, `bulkCreateSeats` methods

#### `src/pages/SeatManagement.tsx`

- Update `handlePlaceSeat` to accept and pass `category` parameter
- Update seat details panel to show category
- Remove props no longer needed: `onGenerateSeatsForSection`, `onAddSeatToSection`, `onDeleteSectionWithSeats`, section-related state
- Keep: `onPlaceSeat`, `onDeleteSeat`, layout image handling, save, floors

#### Props cleanup on FloorPlanDesigner
Remove these props (no longer needed):
- `gridSize`, `onRoomDimensionsChange`
- `sections`, `onSectionsChange`
- `roomElements`, `onRoomElementsChange`
- `onGenerateSeatsForSection`, `onAddSeatToSection`, `onDeleteSectionWithSeats`

Keep:
- `cabinId`, `roomWidth`, `roomHeight`, `seats`, `onSeatsChange`
- `onSeatSelect`, `selectedSeat`, `onSave`, `onDeleteSeat`, `onPlaceSeat`
- `layoutImage`, `layoutImageOpacity`, `onLayoutImageChange`, `onLayoutImageOpacityChange`
- `isSaving`

### Files Summary

| File | Action |
|---|---|
| Database migration | Add `category` text column to `seats` |
| `src/components/seats/FloorPlanDesigner.tsx` | Major cleanup: remove walls, grid, sections, wall elements; add SeatPlacementDialog popup with category |
| `src/pages/SeatManagement.tsx` | Simplify props, add category to placement handler and seat details |
| `src/api/adminSeatsService.ts` | Add `category` field to create/update/map |

