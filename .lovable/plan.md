

## Restructure Hostel Module -- Proper Hierarchy and Configuration System

This plan redesigns the hostel management to follow a clean hierarchical creation flow:
**Hostel -> Categories/Sharing Types (config) -> Floors -> Rooms (under floors) -> Beds (inside rooms)**

---

### Current Problems

- Categories are limited to `standard/premium/luxury` on rooms, while bed categories (AC/Non-AC) are a separate system
- Sharing types are hardcoded as `private/2-sharing/.../6-sharing` in the room creation form
- Floors are just a number field on rooms -- no dedicated floor entity
- Room creation mixes concerns (category, sharing, capacity all in one form)
- No validation that bed count matches sharing type capacity

---

### Database Changes

**1. New table: `hostel_floors`**
```sql
CREATE TABLE hostel_floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id uuid NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
  name text NOT NULL,           -- e.g. "Floor 1", "Basement", "Ground Floor"
  floor_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
With RLS: admins all, partners own hostel, anyone view active.

**2. New table: `hostel_sharing_types`** (hostel-level configurable sharing types)
```sql
CREATE TABLE hostel_sharing_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id uuid NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
  name text NOT NULL,            -- e.g. "Single Sharing", "Two Sharing", "Dormitory"
  capacity integer NOT NULL DEFAULT 1,  -- beds per unit
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
With RLS: admins all, partners own hostel, anyone view active.

**3. Modify `hostel_rooms`**
- Add `floor_id uuid REFERENCES hostel_floors(id)` column
- Add `sharing_type_id uuid REFERENCES hostel_sharing_types(id)` column  
- Add `category_id uuid REFERENCES hostel_bed_categories(id)` column
- Keep existing `floor` integer and `category` text for backward compat (nullable)

**4. Modify `hostel_beds` amenities**
- Add boolean columns or keep the existing `amenities` text array but expand the default options to include: Attached Bathroom, Common Bathroom, Kitchen Access, Study Table, Wardrobe (plus existing ones)
- Add `sharing_type_id uuid REFERENCES hostel_sharing_types(id)` for direct bed-level sharing type reference

---

### UI Changes

**File: `src/pages/admin/HostelBedManagementPage.tsx`** (major rewrite of the configuration section)

Replace the top "Categories + Rooms" card with a tabbed configuration panel:

**Tab 1: Categories** (existing `hostel_bed_categories` -- AC/Non-AC etc.)
- Same CRUD as current category dialog, but promoted to a visible tab
- Add/Edit/Delete categories with price adjustment

**Tab 2: Sharing Types** (new `hostel_sharing_types`)
- List all sharing types for this hostel
- Add new: Name + Capacity (e.g., "Two Sharing" / 2, "Dormitory" / custom number)
- Edit/Delete existing types
- Pre-seed defaults: Single (1), Two Sharing (2), Three Sharing (3), Four Sharing (4)

**Tab 3: Floors** (new `hostel_floors`)
- List all floors
- Add new floor with name and order
- Edit/Delete floors

**Tab 4: Rooms** (restructured room creation)
- List rooms grouped by floor
- "Add Room" dialog fields:
  - Select Floor (from `hostel_floors`)
  - Room Number / Name
  - Select Category (from `hostel_bed_categories` -- AC/Non-AC)
  - Select Sharing Type (from `hostel_sharing_types`)
  - Price (monthly)
- Room capacity auto-calculated from bed count

**Bed Grid (below config tabs):**
- Unchanged structure (floor tabs -> room cards -> bed markers)
- Floor tabs now driven by `hostel_floors` table instead of room.floor integer
- "Add Beds" dialog updated:
  - Select Room (shows floor + room name)
  - Sharing Type auto-inherited from room (or override)
  - Category auto-inherited from room (or override)
  - Amenities expanded: Attached Bathroom (Yes/No), Common Bathroom, Kitchen Access, Study Table, Wardrobe, plus existing options
  - Count
- Room capacity badge auto-updates based on actual bed count

**File: `src/components/admin/AddRoomWithSharingForm.tsx`**
- Update to use `hostel_floors` dropdown instead of free text floor
- Replace hardcoded sharing type dropdown with `hostel_sharing_types` from DB
- Replace `standard/premium/luxury` category with `hostel_bed_categories` from DB
- Remove the "sharing options" field array (sharing type is now at room level, not multiple per room)
- Remove `maxCapacity` field (auto-calculated from beds)

**File: `src/api/hostelRoomService.ts`**
- Update `createRoom` to use `floor_id`, `category_id`, `sharing_type_id`
- Remove the inline sharing options + bed creation logic (beds added separately)
- Update queries to join with new tables

**File: `src/pages/HostelRoomDetails.tsx`** (student booking flow)
- Step 1 sharing type pills: derive from `hostel_sharing_types` instead of `hostel_sharing_options.type`
- Step 2 category pills: derive from `hostel_bed_categories` (unchanged)
- Bed map room filter: use `hostel_floors` for floor tabs
- Bed tooltip: show expanded amenities including bathroom/kitchen tags

**File: `src/components/hostels/HostelBedMap.tsx`**
- Update floor tabs to use `hostel_floors` data
- Update room filter to group by floor_id

**File: `src/components/hostels/HostelFloorView.tsx`**
- No structural changes needed (receives processed data)

**File: `src/pages/HostelRoomView.tsx`**
- Update room list to show floor name, category name, sharing type name from joined data
- Remove inline sharing options table (room has single sharing type now)

**File: `src/components/hostels/HostelBedMapEditor.tsx`**
- Update to use new tables for dropdowns

---

### Validation Rules

1. **Room capacity** = count of beds in that room (auto-calculated, displayed only)
2. **Sharing type validation**: When sharing type is "Two Sharing" (capacity=2), warn if bed count != multiple of 2
3. Beds inherit room's category and sharing type by default, but can be overridden individually

### Migration Strategy

- New tables created alongside existing columns
- Existing `hostel_rooms.floor` integer data preserved; new `floor_id` is nullable initially
- Existing `hostel_sharing_options` table remains functional for backward compatibility with existing bookings
- Admin UI starts using new tables immediately; old data works until manually migrated

---

### Summary of Changes

| Area | Change |
|------|--------|
| DB: `hostel_floors` | New table for floor management |
| DB: `hostel_sharing_types` | New table for configurable sharing types |
| DB: `hostel_rooms` | Add `floor_id`, `sharing_type_id`, `category_id` columns |
| DB: `hostel_beds` | Add `sharing_type_id` column |
| UI: Bed Management Page | Add config tabs (Categories, Sharing Types, Floors, Rooms) |
| UI: Add Room Form | Use DB-driven dropdowns instead of hardcoded values |
| UI: Student Booking | Update to use new tables for filter pills |
| UI: Bed tooltips | Expanded amenity display |

