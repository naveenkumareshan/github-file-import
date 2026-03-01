

## Unify Hostel Duration UI + Add Bed Amenities & Room Filter

### Part 1: Match Hostel Duration UI to Reading Room

Currently the hostel Step 2 uses separate rounded-xl pills, a Popover date picker, and +/- buttons. The reading room uses a more compact segmented toggle, Select dropdown, and inline date row. We will restyle to match exactly.

**File: `src/pages/HostelRoomDetails.tsx` (Step 2 section, lines ~577-664)**

Changes:
- Replace the `rounded-xl` duration pills with the reading room's segmented toggle: `bg-muted/50 rounded-xl p-1` wrapper with internal buttons that use `bg-primary` when selected vs plain text when not
- Replace the +/- counter with a `Select` dropdown (1-12 range for months, 1-30 for days, 1-12 for weeks)
- Combine duration count + start date into a single styled row (`bg-muted/20 rounded-xl p-2.5 border`) matching reading room
- Replace the check-in/check-out info box with an inline "Ends:" badge, matching reading room's end date display
- Add necessary imports: `Select, SelectContent, SelectItem, SelectTrigger, SelectValue`

### Part 2: Add Per-Bed Amenities

**Database Migration:**
Add an `amenities` text array column to `hostel_beds`:
```sql
ALTER TABLE public.hostel_beds ADD COLUMN amenities text[] NOT NULL DEFAULT '{}';
```

**File: `src/components/hostels/HostelBedMapEditor.tsx`**
- In the "Add Beds" dialog, add a multi-select amenity picker with predefined options: Attached Washroom, Study Table, Wardrobe, Bookshelf, Power Socket, Fan, AC, Window Side
- In the "Edit Bed" dialog, add the same amenity picker to update individual bed amenities
- Pass amenities when inserting/updating beds

**File: `src/components/hostels/HostelFloorView.tsx`**
- Show amenity icons/badges on bed tooltips
- Display amenity count or small icons on bed markers

**File: `src/components/hostels/HostelBedMap.tsx`**
- Fetch `amenities` column along with bed data
- Pass amenities through to HostelFloorView

**File: `src/pages/HostelRoomDetails.tsx`**
- Show selected bed's amenities in the Step 5 booking summary

### Part 3: Add Room Filter Pills in Student Booking

**File: `src/pages/HostelRoomDetails.tsx` (Step 1 section)**
- After sharing type and category pills, add a "Room" filter row with room pills derived from the `rooms` state
- Each pill shows room number + floor (e.g., "R101 (F1)")
- Include an "All" option (default)
- When a room is selected, pass `roomFilter` to HostelBedMap so only beds from that room are shown
- Changing room filter resets bed selection (like other filters)

**File: `src/components/hostels/HostelBedMap.tsx`**
- Accept new `roomFilter` prop
- Pass it to HostelFloorView

**File: `src/components/hostels/HostelFloorView.tsx`**
- When `roomFilter` is set (not 'all'), only render the matching room card, hiding others
- This simplifies the view when a floor has multiple rooms

### Part 4: Room Selection in Admin Bed Generator

**File: `src/components/hostels/HostelBedMapEditor.tsx`**
- The "Add Beds" dialog already has a Room selector -- no structural change needed there
- Add the amenities multi-select to the "Add Beds" dialog (covered in Part 2)

---

### Technical Summary

| Change | File(s) |
|--------|---------|
| DB: Add `amenities` column to `hostel_beds` | Migration |
| Restyle duration UI to segmented toggle + Select dropdown | `HostelRoomDetails.tsx` |
| Add amenity picker in bed add/edit dialogs | `HostelBedMapEditor.tsx` |
| Add room filter pills in student booking Step 1 | `HostelRoomDetails.tsx` |
| Pass roomFilter + amenities through bed map | `HostelBedMap.tsx`, `HostelFloorView.tsx` |
| Show amenities in tooltips and booking summary | `HostelFloorView.tsx`, `HostelRoomDetails.tsx` |

