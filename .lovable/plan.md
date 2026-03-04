

# Plan: Per-Duration Locker Mandatory Settings

## What Changes

Currently, locker is either **mandatory for all durations** or **optional for all**. The user wants granular control — e.g., locker mandatory for monthly but optional for daily/weekly.

## Approach

### 1. Add new DB column: `locker_mandatory_durations` (JSONB)
- Add a `locker_mandatory_durations` JSONB column to the `cabins` table, defaulting to `'["daily", "weekly", "monthly"]'`
- When locker is available and this array contains the selected duration, locker is mandatory for that duration; otherwise optional
- Keep existing `locker_mandatory` as a master toggle (if true = use duration-specific list; if false = always optional)

### 2. Update CabinEditor UI (`src/components/admin/CabinEditor.tsx`)
- Below the existing Mandatory/Optional radio buttons, when "Mandatory" is selected, add duration checkboxes (Daily, Weekly, Monthly) — same pattern as advance applicable durations
- Only show durations that are in `allowed_durations`

### 3. Update admin cabins service (`src/api/adminCabinsService.ts`)
- Persist `locker_mandatory_durations` on create/update

### 4. Update student booking form (`src/components/seats/SeatBookingForm.tsx`)
- Instead of `const lockerMandatory = cabin.lockerMandatory`, check if selected duration is in `locker_mandatory_durations` array
- If duration is in the list → mandatory; otherwise → optional checkbox

### 5. Update partner booking (`src/pages/vendor/VendorSeats.tsx`)
- Same logic: check selected duration against `locker_mandatory_durations`

### 6. Update vendor seats service (`src/api/vendorSeatsService.ts`)
- Map `locker_mandatory_durations` from cabin data

## DB Migration
```sql
ALTER TABLE public.cabins 
ADD COLUMN locker_mandatory_durations jsonb NOT NULL DEFAULT '["daily", "weekly", "monthly"]';
```

## Files to modify
| File | Change |
|------|--------|
| DB migration | Add `locker_mandatory_durations` column |
| `src/components/admin/CabinEditor.tsx` | Add duration checkboxes under locker mandatory |
| `src/api/adminCabinsService.ts` | Persist new field |
| `src/api/vendorSeatsService.ts` | Map new field |
| `src/components/seats/SeatBookingForm.tsx` | Duration-aware mandatory check |
| `src/pages/vendor/VendorSeats.tsx` | Duration-aware mandatory check |

