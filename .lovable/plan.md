

## Dependency-Safe Deletes for Categories/Sharing Types + Student Bed Selection View Toggle

### 1. Category and Sharing Type deletion dependency checks

**Problem**: Categories and sharing types can be deleted even when beds reference them, leaving orphaned data.

**Solution (File: `src/pages/admin/HostelBedManagementPage.tsx`)**:

- **`handleDeleteCategory`**: Before deleting, query `hostel_beds` to count beds where `category` matches the category name. If count > 0, show a toast error: "Delete all beds with this category first" and abort. Otherwise proceed with deletion.
- **`handleDeleteSharingType`**: Before deleting, query `hostel_beds` joined through `hostel_sharing_options` to check if any beds use sharing options of this type. If count > 0, show toast error: "Delete all beds using this sharing type first" and abort. Otherwise proceed.

Also apply the same logic in **`src/components/hostels/HostelBedMapEditor.tsx`** if it has its own `handleDeleteCategory`.

### 2. Student-side bed selection: Grid vs Layout Plan toggle

**Problem**: Students currently only see the grid view (HostelBedMap with HostelFloorView). They should also be able to see the layout plan (visual map) and pick a bed from either view.

**Changes**:

**File: `src/pages/HostelRoomDetails.tsx`** (Step 4: Select Your Bed)

- Add a toggle state: `const [bedViewMode, setBedViewMode] = useState<'grid' | 'layout'>('grid');`
- Add two small toggle buttons (Grid icon / Map icon) next to the "Select Your Bed" header label
- When `bedViewMode === 'grid'`: render the existing `<HostelBedMap>` component (current behavior)
- When `bedViewMode === 'layout'`: render a new `<HostelBedLayoutView>` component that shows the room layout with draggable-looking beds in their positioned layout (read-only, click-to-select)

**New file: `src/components/hostels/HostelBedLayoutView.tsx`**

A read-only layout viewer for students that:
- Takes props: `hostelId`, `selectedBedId`, `onBedSelect`, `sharingFilter`, `categoryFilter`, `startDate`, `endDate`
- Fetches rooms with their layout dimensions (`room_width`, `room_height`, `layout_image`, `layout_image_opacity`) and beds with `position_x`, `position_y`, `rotation`
- Also fetches bookings for date-aware availability (same logic as HostelBedMap)
- Renders each room as a scaled-down canvas/div with:
  - Optional background layout image
  - `BedShapeIcon` components positioned at their `(position_x, position_y)` with their `rotation`
  - Click on a bed to select it (calls `onBedSelect`)
  - Status coloring: available (green), occupied (blue), selected (primary), filtered-out (muted)
- Shows floor tabs and room filter pills (same pattern as HostelBedMap)
- Scales the room dimensions to fit within the mobile viewport (e.g., scale factor to fit ~350px width)

**File: `src/components/hostels/HostelBedMap.tsx`**

- No changes needed -- it continues to work as the grid view

### Technical Notes

- The layout view reuses `BedShapeIcon` for consistent bed visuals across admin and student views
- Beds without positions (0,0) will be auto-arranged or shown at default positions
- The toggle buttons use `LayoutGrid` and `MapIcon` icons from lucide-react, styled as small pill buttons similar to the sharing type pills
- The same `onBedSelect` callback is used regardless of view mode, so all downstream logic (package selection, payment) remains unchanged

