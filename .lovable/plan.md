

## Redesign Location Management + Fix Area Selection

### Problem
1. **Location Management page** has a basic table UI — needs a modern SaaS-style redesign with stat cards, better filtering, pagination, and inline editing
2. **Areas table is empty** (0 rows) — areas can't be selected anywhere because none exist yet. The area selection in `LocationSelector` works correctly code-wise (loads areas by city_id), but there's no data
3. The `LocationSelector` component's `React.memo` wrapper causes a ref warning in console

### What We'll Build

**1. Redesign `LocationManagement.tsx`** — Complete SaaS-style rewrite

- **Header**: Title with total count badges per tab (States [36], Cities [85], Areas [0])
- **Stat cards row**: Total States, Total Cities, Total Areas, Inactive counts — color-coded with icons
- **Tabs** with count badges, search bar inline with tab content
- **Table improvements**: Add S.No. column using `getSerialNumber`, status badges (Active/Inactive teal theme), pagination via `AdminTablePagination`, rows-per-page selector
- **Create dialog**: Better form layout, validation feedback
- **Edit inline**: Add edit button to each row (opens dialog pre-filled) alongside deactivate
- **Reactivate** option for inactive items (toggle to show inactive items)
- **Filter by state** when viewing cities/areas tabs
- **Bulk import hint**: Show empty state with "Add your first area" CTA when areas tab is empty

**2. Fix `LocationSelector` area loading** — The code is correct but areas table is empty. We'll:
- Add a helpful empty state message in the area dropdown ("No areas found — add areas in Location Management")
- Remove `React.memo` wrapper to fix the ref warning, or wrap with `forwardRef`

**3. Ensure area selection works everywhere** — Verify all consumers pass `area_id` correctly:
- `CabinEditor.tsx` — uses `cabin?.area` ✓
- `HostelEditor.tsx` — uses `hostel.area_id` ✓  
- `HostelForm.tsx` — uses `formData.area_id` ✓
- `CabinSearch.tsx` / `LocationSearch.tsx` — uses `filters.areaId` ✓
- All are wired correctly — issue is purely **no area data exists**

### Files to Modify
- `src/components/admin/LocationManagement.tsx` — Complete SaaS-style rewrite with stats, pagination, edit, filter-by-state, show-inactive toggle
- `src/components/forms/LocationSelector.tsx` — Add empty state text for areas, fix memo/ref warning

### No Database Changes
Tables `states`, `cities`, `areas` already exist with correct schema. The user needs to add area data via the improved Location Management page.

