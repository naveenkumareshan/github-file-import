

## Add Room Number to Bed Cards in Hostel Bed Map

### Problem
Beds from different rooms can have the same bed number (e.g., B1 in Room 101 and B1 in Room 201). Currently the grid card only shows "B1" with no room context, making it impossible to differentiate.

### Solution
Add the room number below the bed number label on each grid card, and also include it in the sheet title when a bed is clicked.

### Changes

**`src/pages/admin/HostelBedMap.tsx`**:

1. **Grid card** (line ~851): Change `B{bed.bed_number}` to show room number alongside:
   - Display: `R{roomNumber}-B{bed_number}` as the bold title (e.g., "R101-B1")
   - This replaces the current `B{bed.bed_number}` label

2. **Sheet title** (line ~1004): Update from `Bed #{selectedBed.bed_number}` to `Room {roomNumber} - Bed #{bed_number}`

3. **Block dialog title** (line ~976): Update from `Bed #{blockBed?.bed_number}` to include room number

4. **Transfer bed cards** (line ~1532): Already shows `R{roomNumber}` -- no change needed

5. **Table view** (line ~902): Already shows room number in a separate column -- no change needed

### Visual Result (Grid Card)
```text
Before:          After:
 B1               R101-B1
 standard         standard
 8500 [edit]      8500 [edit]
 Available        Available
```
