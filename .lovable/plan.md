

## Clean Up Add Room Dialog and Bed Grid Hierarchy

### Problems Identified

1. **Add Room dialog** (lines 987-1005): Shows Category and Sharing Type selectors that should not be there -- these are per-bed settings, not per-room.
2. **Bed grid** (line 756): Shows legacy `room.roomCategory` (e.g., "premium", "standard") as badges on room cards -- these legacy labels should be removed.
3. **Floor grouping** (line 164-165): Falls back to `Floor ${room.floor}` when no `floor_id` is set, creating phantom "Floor 2" entries from the old integer `floor` column. Rooms without a proper `floor_id` should be grouped under "Unassigned" instead.
4. **Room cards** show `categoryName` and `sharingTypeName` badges (lines 754-756) -- since category and sharing type are now per-bed, these room-level badges should be removed.

### Changes

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

1. **Add Room Dialog** (lines 986-1006): Remove the Category selector and Sharing Type selector fields entirely. Room creation only needs: Floor + Room Number/Name + Description. Remove `newRoomCategoryId` and `newRoomSharingTypeId` state variables and their usage in `handleAddRoom`.

2. **handleAddRoom** (lines 476-524): Remove `category_id`, `sharing_type_id`, `category` from the insert. Remove the auto-create sharing option logic (lines 494-513) since sharing type is per-bed now.

3. **Room card badges** (lines 754-756): Remove `categoryName` and `sharingTypeName` badges from room cards in the grid view. Also remove the legacy `room.roomCategory` badge fallback.

4. **Floor grouping fallback** (lines 163-165): Change the fallback from `Floor ${room.floor}` to `Unassigned` so phantom floor tabs don't appear. Only rooms with a proper `floor_id` get grouped under named floors.

5. **State cleanup**: Remove `newRoomCategoryId` and `newRoomSharingTypeId` state declarations (lines 92-93) and their reset in `handleAddRoom` (line 518).

### Summary

| Change | Detail |
|--------|--------|
| Remove Category from Add Room | Delete selector + state + insert logic |
| Remove Sharing Type from Add Room | Delete selector + state + auto-sharing-option creation |
| Remove legacy badges on room cards | Delete categoryName, sharingTypeName, roomCategory badges |
| Fix phantom floor tabs | Fallback to "Unassigned" instead of "Floor N" |

