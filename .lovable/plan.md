

## Restructure Bed Management: Floor-wise Room Selector with Per-Room Layouts

### Current Issues
- The page has a flat view toggle between "Box Grid" and "Layout Plan" -- user wants both visible together
- Room selection is scattered -- no clear floor-first, then room hierarchy in the main content area
- Layout plan is global (one view) rather than per-room
- Adding beds requires a separate dialog with room picker instead of being contextual to the selected room

### New Layout Structure

```text
+-------------------------------------------------------+
| Header + Config Panel (Categories/Sharing/Floors/Rooms)|
+-------------------------------------------------------+
| Floor Tabs: [Ground Floor] [First Floor] [Second Floor]|
+-------------------------------------------------------+
| Room Pills: [Room 101] [Room 102] [Room 103]  + Add   |
+-------------------------------------------------------+
| [+ Add Beds]                                           |
+-------------------------------------------------------+
| Box Grid (beds as cards)          | Room Stats         |
| Bed #1  Bed #2  Bed #3  Bed #4   | 4/6 available      |
| Bed #5  Bed #6                    | 67% occupancy      |
+-------------------------------------------------------+
| Layout Plan (per-room image + draggable bed markers)   |
| [Upload Layout Image]  [Save Layout]                   |
| +---------------------------------------------------+ |
| | Room layout canvas with bed positions              | |
| +---------------------------------------------------+ |
+-------------------------------------------------------+
| Legend: Available | Occupied | Blocked                  |
+-------------------------------------------------------+
```

### Changes to `src/pages/admin/HostelBedManagementPage.tsx`

**1. Replace the view mode toggle with a unified view**
- Remove the `viewMode` state and the toggle buttons (lines 716-731)
- Both Box Grid and Layout Plan are shown together, stacked vertically, for the currently selected room

**2. Add floor tabs as the primary navigation in the content area**
- Use `floors` array to render floor tabs (not `floorKeys` from `floorData`)
- Add a `selectedFloorId` state to track which floor tab is active
- Default to the first floor on load

**3. Add room pills row below floor tabs**
- Filter `rooms` by `selectedFloorId` to show only rooms on the selected floor
- Show room pills (already exists in config Rooms tab -- replicate as navigation pills in the content area)
- Include an inline "+ Add Room" button
- Selecting a room sets `selectedRoomId`

**4. Show Box Grid for selected room only**
- Instead of showing all rooms on a floor in the grid, show only the beds for the currently selected room
- Keep the same bed card UI (status colors, badges, click to edit)

**5. Show Layout Plan below the Box Grid for the same room**
- Always show the `HostelBedPlanDesigner` for the selected room below the grid
- Each room has its own `layout_image`, `room_width`, `room_height` -- already stored per room
- Load designer data whenever `selectedRoomId` changes (remove the `viewMode === 'floorplan'` guard)

**6. Update Add Beds button**
- The "Add Beds" button pre-fills the selected floor's rooms and the currently selected room
- Remove the room selector from the Add Beds dialog since the room is already selected contextually (or keep it but default to current room)

**7. State changes**
- Add: `selectedFloorId` state
- Remove: `viewMode` state
- Update the `useEffect` for designer data to trigger on `selectedRoomId` change (remove `viewMode` condition)

### Summary

| Change | Detail |
|--------|--------|
| Remove view mode toggle | Show both grid + layout together |
| Add floor tabs in content | Primary navigation by floor |
| Add room pills row | Secondary navigation by room within floor |
| Box grid = single room | Show beds for selected room only |
| Layout plan always visible | Per-room layout shown below grid |
| Auto-select first room | When floor changes, select first room on that floor |

