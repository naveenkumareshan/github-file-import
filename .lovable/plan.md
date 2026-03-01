

## Fix Delete Confirmations, Compact Bed Grid, and Layout Sync

### Issue 1: Delete actions need confirmation dialogs with dependency checks

Currently, clicking delete on a room, floor, or bed executes immediately with no warning. We need:

- **Confirmation dialog** (AlertDialog) before any delete action
- **Dependency enforcement**:
  - Floor cannot be deleted if it has rooms -- show error message asking to delete rooms first
  - Room cannot be deleted if it has beds -- show error message asking to delete beds first
  - Bed can be deleted after confirmation (unless occupied)

### Issue 2: Bed cards in grid are too large

Current bed cards use `p-3` padding and show all details expanded. Changes:
- Shrink cards: reduce padding to `p-2`, use smaller text
- Add explicit small **Edit** (pencil) and **Delete** (trash) icon buttons on each card
- Show only essential info: bed number, status dot, category badge, price
- Move amenities and occupant details to the edit dialog

### Issue 3: Beds added via "Add Beds" dialog don't appear in Layout Plan

The `handleAddBeds` function inserts beds into the database and calls `fetchAll()`, which updates `floorData` (used by the grid). However, it does NOT update `designerBeds` (used by the layout plan). The layout plan only refreshes when `selectedRoomId` changes (useEffect on line 204).

**Fix**: After `fetchAll()` completes in `handleAddBeds`, re-trigger the designer data load by calling the same logic used in the `useEffect` -- extract it into a reusable function `loadDesignerData(roomId)` and call it after adding beds.

---

### File: `src/pages/admin/HostelBedManagementPage.tsx`

**1. Add confirmation state and AlertDialog imports**
- Import `AlertDialog` components from radix
- Add state for `deleteConfirm`: `{ type: 'bed'|'room'|'floor', id: string, name: string } | null`

**2. Wrap all delete handlers with dependency checks**
- `handleDeleteFloor`: Check if any rooms exist on that floor. If yes, show toast error "Delete all rooms on this floor first". If no, show confirmation dialog.
- `handleDeleteRoom`: Check if any beds exist in that room. If yes, show toast error "Delete all beds in this room first". If no, show confirmation dialog.
- `handleDeleteBed`: Show confirmation dialog. If bed has occupant, prevent deletion.

**3. Add AlertDialog component to the JSX**
- Render a single AlertDialog controlled by `deleteConfirm` state
- On confirm, execute the actual delete based on `deleteConfirm.type`

**4. Compact bed grid cards**
- Change grid from `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` to `grid-cols-3 md:grid-cols-4 lg:grid-cols-6`
- Reduce padding from `p-3` to `p-2`
- Show: bed number + status dot on one line, category/sharing badges, price
- Remove inline amenities display from grid cards
- Add small Edit (pencil) and Delete (trash) icon buttons in the card header

**5. Fix layout plan sync after adding beds**
- Extract the designer data loading logic (lines 206-241) into a standalone async function `loadDesignerData(roomId)`
- Call `loadDesignerData(selectedRoomId)` inside `handleAddBeds` after `fetchAll()` completes
- Also call it after `handleDeleteBed` completes

