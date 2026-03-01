

## Fix "Floor Plan" Rename and Sharing Type Selection

### Problem 1: "Floor Plan" label is confusing
All references to "Floor Plan" should be renamed to "Layout Plan" across the bed management page.

### Problem 2: Sharing Type not selectable when adding beds
The Add Beds dialog loads sharing options from the `hostel_sharing_options` table filtered by `room_id`. But since we removed the auto-creation of sharing options during room creation, no `hostel_sharing_options` records exist for new rooms -- so the dropdown is always empty.

**Fix**: Change the Add Beds dialog to use the hostel-level `hostel_sharing_types` (which the admin has already created) instead of room-level `hostel_sharing_options`. When beds are added, auto-create the corresponding `hostel_sharing_options` record for that room if one doesn't already exist.

---

### File: `src/pages/admin/HostelBedManagementPage.tsx`

**Rename "Floor Plan" to "Layout Plan"** (3 locations):
- Line 693: Button label `Floor Plan` -> `Layout Plan`
- Line 821: Empty state text "Select a room to view the floor plan" -> "Select a room to view the layout plan"
- Comment on line 337/46 referencing "Floor plan" -> "Layout plan"

**Fix sharing type in Add Beds dialog**:
1. Replace `loadAddDialogSharingOptions` (lines 287-294): Instead of querying `hostel_sharing_options` by room, populate the dropdown directly from the already-loaded `sharingTypes` state (hostel-level sharing types).
2. Update `addDialogSharingOptions` to be populated from `sharingTypes` array.
3. Update `handleAddBeds` (lines 302-335): Before inserting beds, look up or auto-create a `hostel_sharing_options` record for the selected room + sharing type combo. Use the resulting ID as the `sharing_option_id` for each bed. Also set `sharing_type_id` on each bed.
4. Update the Add Beds dialog UI (lines 892-901): Display sharing types with their name and capacity instead of `s.type`.

### Summary

| Change | Detail |
|--------|--------|
| Rename "Floor Plan" | Change to "Layout Plan" in 3 places |
| Fix sharing dropdown | Use hostel-level sharing types instead of empty room-level options |
| Auto-create sharing option | Create `hostel_sharing_options` record on-the-fly when adding beds |

