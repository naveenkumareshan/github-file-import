

## Simplify Admin Bed Management Page

### Overview
Remove the "Date Availability" and "Transfer" tabs from the admin hostel bed management page. Enhance the "Add Beds" and "Edit Bed" dialogs with proper Room selection and Amenities picker, so beds are fully configured at creation time.

### Changes

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

1. **Remove tabs entirely** (lines 411-542)
   - Remove the outer `Tabs` wrapper with "Bed Map", "Date Availability", "Transfer"
   - Remove `DateBasedBedMap` and `HostelBedTransferManagement` imports and their `TabsContent`
   - Remove `activeTab` state
   - Remove unused imports: `CalendarDays`, `ArrowRight`
   - Render the bed map content (view toggle + grid/floorplan) directly without tabs

2. **Add Room selector to "Add Beds" dialog** (lines 586-621)
   - Add a Room dropdown as the first field (currently it silently uses `selectedRoomId`)
   - When room changes, dynamically load that room's sharing options for the next dropdown
   - Add state for `addRoomIdInDialog` to track selection within dialog

3. **Add Amenities picker to "Add Beds" dialog**
   - Add multi-select checkboxes for amenities (Attached Washroom, Study Table, Wardrobe, Bookshelf, Power Socket, Fan, AC, Window Side)
   - Pass selected amenities when inserting beds
   - Add `addAmenities` state

4. **Add Amenities picker to "Edit Bed" dialog** (lines 544-583)
   - Add amenities multi-select checkboxes (same options)
   - Save amenities on update
   - Add `editAmenities` state
   - Fetch current amenities when opening edit dialog

5. **Show amenities in bed tooltips** (lines 473-483)
   - Display amenities as comma-separated list in the grid tooltip

### What stays the same
- Categories + Rooms summary card at top
- Grid view and Floor Plan view toggle
- Category management dialog
- Block/Unblock functionality
- Bed Details dialog
- All existing CRUD operations

### Technical Summary

| Change | Detail |
|--------|--------|
| Remove tabs | Delete `activeTab`, remove outer Tabs, remove DateBasedBedMap + Transfer imports and content |
| Add Room to Add dialog | Room dropdown as first field, sharing options filter by selected room |
| Add Amenities to Add dialog | Multi-select checkboxes with 8 preset options, saved on insert |
| Add Amenities to Edit dialog | Same checkboxes, loaded from bed data, saved on update |
| Tooltips | Show amenities in grid bed tooltips |

