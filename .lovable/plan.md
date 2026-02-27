

## Add Stay Duration Type (Daily/Weekly/Monthly) Step

### Overview
Add a new step between bed selection and package selection that lets students choose their stay duration type: **Daily**, **Weekly**, or **Monthly**. The existing "Choose Stay Duration" step gets renamed to "Choose Package". Packages will be filtered by the selected duration type.

### Database Changes

**Add `duration_type` column to `hostel_stay_packages` table:**
- `duration_type` (text, default `'monthly'`) -- values: `daily`, `weekly`, `monthly`

This allows admins to create packages specific to each duration type (e.g., daily packages with different pricing, weekly discount packages, monthly long-term packages).

**Migration SQL:**
```sql
ALTER TABLE public.hostel_stay_packages 
  ADD COLUMN duration_type text NOT NULL DEFAULT 'monthly';
```

Update existing packages to default `'monthly'`.

### File Changes

| File | Action | Description |
|---|---|---|
| DB migration | New | Add `duration_type` to `hostel_stay_packages` |
| `src/api/hostelStayPackageService.ts` | Edit | Add `duration_type` to interfaces; filter `getPackages` by duration type |
| `src/components/hostels/StayDurationPackages.tsx` | Edit | Rename heading to "Choose Package"; accept `durationType` prop to filter; adjust price label (/day, /wk, /mo) |
| `src/pages/HostelRoomDetails.tsx` | Edit | Add new Step 3 with Daily/Weekly/Monthly pill selector; renumber existing Step 3 to Step 4 "Choose Package"; pass selected duration type to StayDurationPackages |
| `src/components/admin/HostelStayPackageManager.tsx` | Edit | Add `duration_type` dropdown (Daily/Weekly/Monthly) to the create/edit form |
| `src/pages/HostelBooking.tsx` | Edit | Accept `durationType` from navigation state; use it in price calculations |

### Student Flow (Updated)

```text
Step 1: Select Sharing Type (filter pills) -- unchanged
Step 2: Select Your Bed (inline bed map) -- unchanged
Step 3: Stay Duration Type [NEW]
  [Daily] [Weekly] [Monthly]  <-- pill toggle, default Monthly
Step 4: Choose Package (renamed from "Choose Stay Duration")
  Packages filtered by selected duration type
  Price labels adjust: /day, /wk, /mo
```

### Admin Changes

The package create/edit dialog gets a new **Duration Type** dropdown with options: Daily, Weekly, Monthly. This lets hostel owners create separate packages per duration type (e.g., "Weekend Special" as a daily package, "3 Months+" as a monthly package).

### Pricing Logic

- **Daily**: `StayDurationPackages` shows price as `/day` -- base price = bed monthly price / 30
- **Weekly**: Shows price as `/wk` -- base price = bed monthly price / 4
- **Monthly**: Shows price as `/mo` -- base price = bed monthly price (unchanged)

The discount percentage from the package is applied to the calculated base price for that duration type.

### Sticky Bottom Bar Update

The bottom bar price label updates to match duration type: "Rs X/day", "Rs X/wk", or "Rs X/mo".

### Technical Notes

- Duration type state is managed in `HostelRoomDetails.tsx` alongside other selection state
- When duration type changes, the selected package resets (since packages are filtered)
- The `StayDurationPackages` component re-fetches/re-filters when `durationType` prop changes
- Navigation state to `HostelBooking` includes `durationType` for correct price calculation

