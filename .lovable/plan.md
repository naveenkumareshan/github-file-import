

# Add "Student Visibility" Toggle for All Property Types

## Problem
Currently, the only way to hide a property from students is to deactivate it (`is_active = false`) or turn off booking (`is_booking_active = false`). But deactivating removes it from partner management too, and turning off booking still shows the property to students. Admins need a dedicated toggle to control student-side visibility independently.

## Solution
Add a new `is_student_visible` column (default `true`) to all three property tables (`cabins`, `hostels`, `mess_partners`). Admins can toggle this per property. Student-facing listing pages will filter out properties where `is_student_visible = false`.

## Database Migration
Add `is_student_visible` boolean column to `cabins`, `hostels`, and `mess_partners` tables, defaulting to `true`.

## Service Layer
- Add `toggleStudentVisible` function in `adminRoomsService.ts` for cabins
- Add similar toggle in hostel and mess management pages (inline like existing toggles)

## Student-Facing Pages (Filter Changes)
- **`cabinsService.ts`** → `getAllCabins`: add `.eq('is_student_visible', true)` filter
- **`hostelService.ts`** → `getAllHostels`: add `.eq('is_active', true).eq('is_student_visible', true)` filter (also fixing missing `is_active` filter)
- **`messService.ts`** → `getMessPartners`: when `active: true`, also add `.eq('is_student_visible', true)`

## Admin/Partner Property Cards (New Toggle Button)
- **`CabinItem.tsx`**, **`HostelItem.tsx`**, **`MessItem.tsx`**: Add a new toggle button (Eye icon with student label) visible only to admins, using same pattern as existing toggles
- Badge on card: show "● Student Hidden" / "● Student Visible" status pill in the meta row

## Props & Callbacks
- Add `onToggleStudentVisible` prop to each property item component
- Wire up in parent management pages (`CabinManagement`, `HostelManagement`, `MessManagement`)

## Files Modified
- New migration: add `is_student_visible` to 3 tables
- `src/api/cabinsService.ts` — filter student listings
- `src/api/hostelService.ts` — filter student listings + fix missing is_active
- `src/api/messService.ts` — filter student listings
- `src/components/admin/CabinItem.tsx` — admin toggle + status badge
- `src/components/admin/HostelItem.tsx` — admin toggle + status badge
- `src/components/admin/MessItem.tsx` — admin toggle + status badge
- Parent management pages — wire toggle callbacks

