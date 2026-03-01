

## Restructure Bed Management -- Clean Hierarchy with Room-like Bed Cards

### Changes Overview

1. **Categories Tab**: Remove price adjustment field -- categories are just labels (AC/Non-AC). Price is set per bed only.
2. **Rooms Tab**: Remove price field from Add Room dialog. Add delete button per room (soft-delete: sets `is_active=false`, existing bookings untouched). Remove "Legacy Rooms" section entirely. Add rename/edit option per room.
3. **Add Beds dialog**: Include price field, category selector, sharing type selector, and amenities picker -- all per-bed configuration.
4. **Bed Grid display**: Change beds from tiny square icons to room-style cards showing bed number, category badge, sharing type badge, price, amenities, and status -- matching the room card layout pattern.
5. **Floors Tab**: After floor selection, allow renaming rooms/flats. Room layout image upload and bed placement remain in Floor Plan view.

---

### Detailed File Changes

**File: `src/pages/admin/HostelBedManagementPage.tsx`**

**Categories Tab (lines 555-573)**
- Remove the `newCatPrice` input and `+Rs` display on category pills
- Category creation only needs a name
- Update `handleAddCategory` to pass `0` for price_adjustment always

**Rooms Tab (lines 620-675)**
- Remove price field from Add Room dialog (lines 949-952)
- Remove `newRoomPrice` state variable
- Remove price from `hostel_sharing_options` insert in `handleAddRoom`
- Add a delete button next to each room pill (trash icon)
- Add `handleDeleteRoom` function: sets `is_active = false` on the room (keeps bookings intact)
- Add rename button (pencil icon) next to each room with inline edit or small dialog
- Remove the "Legacy Rooms" section entirely (lines 657-673)

**Bed Grid View (lines 726-757)**
- Replace the small `grid-cols-5 sm:grid-cols-6` icon grid with `grid-cols-1 md:grid-cols-2` card layout
- Each bed card shows:
  - Bed number (bold)
  - Category badge (e.g., "AC") 
  - Sharing type badge (e.g., "Single")
  - Price display
  - Amenities as small chips
  - Status indicator (Available/Occupied/Blocked)
  - Click to edit

**Add Beds Dialog (lines 854-909)**
- Add a **Price (per month)** field for setting bed price at creation
- This price is stored as `price_override` on the bed
- Category, sharing type selector, amenities already exist -- keep them
- Add `addPrice` state variable

**Edit Bed Dialog (lines 802-852)**
- Already has price override, category, amenities -- no structural changes needed

**Add Room Dialog (lines 911-962)**
- Remove Price field
- Add a note: "Beds and pricing are configured after room creation"

### Database Note
- No schema changes needed. `hostel_bed_categories.price_adjustment` column stays but is always set to 0
- Room deletion is soft-delete via existing `is_active` column
- Bed price uses existing `price_override` column

### Summary

| Change | Location |
|--------|----------|
| Remove price from categories | Categories tab + handleAddCategory |
| Remove price from rooms, add delete + rename | Rooms tab + Add Room dialog |
| Remove legacy rooms section | Rooms tab |
| Add price field to Add Beds dialog | Add Beds dialog |
| Bed cards instead of tiny squares | Grid view bed rendering |
| Rename room option | Room pills in Rooms tab |

