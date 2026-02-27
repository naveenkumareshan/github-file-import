
## Fix: Add 24/7, Timings, and Slot Management to CabinEditor

### Problem
The admin room management page (`/admin/rooms`) uses the `CabinEditor` component, but all the 24/7, timing, and slot-based booking features were added to `CabinForm` -- a component that is **not used** in the admin flow. The service layer (`adminCabinsService`) already supports these fields, but `CabinEditor` neither stores them in state nor renders the UI for them.

### Root Cause
Two different form components exist for cabins:
- `CabinForm.tsx` -- has timing/slot UI but is unused in the main admin workflow
- `CabinEditor.tsx` -- the actual component used at `/admin/rooms`, missing all timing/slot features

### Changes Required

**File: `src/components/admin/CabinEditor.tsx`**

1. **Add timing fields to component state** (around line 50-92 where `cabin` state is initialized):
   - `is24Hours` (from `existingCabin?.is_24_hours`)
   - `slotsEnabled` (from `existingCabin?.slots_enabled`)
   - `openingTime` (from `existingCabin?.opening_time`, default `'06:00'`)
   - `closingTime` (from `existingCabin?.closing_time`, default `'22:00'`)
   - `workingDays` (from `existingCabin?.working_days`, default all 7 days)

2. **Add "Room Timings" UI section** inside the "Reading Room Details" tab (after the price/images section, around line 674):
   - 24/7 toggle (checkbox or switch)
   - When OFF: show opening time, closing time inputs and working day checkboxes
   - When ON: show "Open 24/7" info message, hide time/day inputs
   - Slot-based booking toggle
   - When slots enabled and cabin has an ID: render `SlotManagement` component
   - Import `Switch` from UI components and `SlotManagement` from admin components

3. **No changes needed to `RoomManagement.tsx`** -- `handleSaveCabin` already passes the full `cabin` object spread, and the service maps `is24Hours`, `slotsEnabled`, `openingTime`, `closingTime`, `workingDays` correctly. We just need to make sure `CabinEditor` includes these keys in the state object it passes to `onSave`.

**File: `src/pages/RoomManagement.tsx`**

4. **Pass timing fields in `cabinDataStore`** (lines 191-229):
   - Add `is24Hours`, `slotsEnabled`, `openingTime`, `closingTime`, `workingDays` from `cabinData` to the object sent to `adminCabinsService`

### Technical Details

- The `SlotManagement` component and `cabinSlotService` are already created and functional
- The database columns (`is_24_hours`, `slots_enabled`, `opening_time`, `closing_time`, `working_days`) already exist on the `cabins` table
- The `adminCabinsService.createCabin` and `updateCabin` already map these fields correctly
- The student-facing display (`CabinCard`, `BookSeat`, etc.) already reads and displays these fields
- This is purely a matter of wiring the existing backend + display logic into the `CabinEditor` admin form

### Result
After this fix, admins/partners will see and configure 24/7 mode, opening/closing times, working days, and slot-based booking directly in the room editor they actually use.
