

## Remove Duplicate Rooms Section from Config Panel

### Problem
The "Rooms" tab in the configuration panel duplicates the room listing that already exists in the Floor Tabs + Room Pills navigation below it. The user confirmed the second (floor tabs + room pills) is the preferred UI.

### Changes

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

1. **Remove the "Rooms" tab from the config panel**
   - Change the config tabs grid from `grid-cols-4` to `grid-cols-3`
   - Remove the `<TabsTrigger value="rooms">` element (line 593)
   - Remove the entire `<TabsContent value="rooms">` block (lines 660-722)

2. **Add rename and delete actions to the Room Pills**
   - The room pills (lines 750-770) currently only show room name and availability but lack edit/delete actions that existed in the removed Rooms tab
   - Add a small pencil icon and trash icon next to each room pill, matching the style already used in the old Rooms tab
   - Reuse the existing `handleRenameRoom`, `handleDeleteRoom`, `renameRoomId`, and `renameRoomValue` state and handlers

3. **Move the "Add Room" button**
   - The "Add Room" button already exists in the room pills row (lines 771-781), so no duplication needed
   - The "Add Room" action in the removed config tab is redundant

### Result
- Config panel becomes a clean 3-tab panel: Categories, Sharing Types, Floors
- All room management (view, add, rename, delete) happens contextually in the Floor Tabs + Room Pills section
- No duplicate room listings

