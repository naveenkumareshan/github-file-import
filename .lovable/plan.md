
## Remove Default "Room" Prefix from Room Labels

### Problem
When a room is manually named (e.g., "Flat 101"), the UI prepends "Room" making it display as "Room Flat 101". The word "Room" should be removed since the user provides the full name themselves.

### Changes

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

Remove the hardcoded "Room " prefix from 4 locations:

1. **Line 328** -- Delete confirmation dialog name: Change `` `Room ${roomNumber}` `` to just `roomNumber`
2. **Line 770** -- Room pill label: Change `Room {room.room_number}` to `{room.room_number}`
3. **Line 826** -- "Add Beds" helper text: Change `to Room {selectedRoom?.room_number}` to `to {selectedRoom?.room_number}`
4. **Line 836** -- Bed grid section header: Change `Room {selectedRoom?.room_number}` to `{selectedRoom?.room_number}`
