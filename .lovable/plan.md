
# Fix All TypeScript Build Errors

Your project has been successfully imported and the pages are all visible, but there are TypeScript type errors that prevent it from compiling. Here is a breakdown of every issue and the fix plan:

## Summary of Issues Found

### 1. Missing Export: `RoomSeatButton` from `RoomSeatButton.tsx`
- **Files affected**: `RoomSeatMapView.tsx`, `SeatSelectionMap.tsx`
- **Problem**: The file defines and exports `RoomSeat` interface but never exports a `RoomSeatButton` component
- **Fix**: Add a default `RoomSeatButton` React component export to `RoomSeatButton.tsx`

### 2. Missing Export: `BookingPlan` from `bookingData.ts`
- **Files affected**: `BookingForm.tsx`, `CustomerForm.tsx`
- **Problem**: `BookingPlan` is declared locally but not exported
- **Fix**: Add `export` keyword to the `BookingPlan` interface in `bookingData.ts`

### 3. Missing Export: `RoomData` from `adminRoomsService.ts`
- **File affected**: `admin/RoomForm.tsx`
- **Problem**: `RoomData` interface is declared but not exported
- **Fix**: Add `export` keyword to the `RoomData` interface

### 4. Missing Export: `formatCurrency` from `currency.ts`
- **Files affected**: `InstantSettlementDialog.tsx`, `PayoutBalanceCard.tsx`
- **Problem**: `currency.ts` only exports `formatBookingPeriod` — no `formatCurrency` function exists
- **Fix**: Add a `formatCurrency` export function to `currency.ts`

### 5. Missing PWA module: `virtual:pwa-register`
- **File affected**: `main.tsx`
- **Problem**: The `vite-plugin-pwa` package is not installed, so `virtual:pwa-register` cannot be resolved
- **Fix**: Remove the PWA registration code from `main.tsx` (or wrap with a try/catch type declaration)

### 6. `Booking` type: `seatId` and `cabinId` are typed as `string` but used as objects
- **Files affected**: `BookingRenewal.tsx`, `BookingsList.tsx`
- **Problem**: `BookingTypes.ts` defines `seatId: string` and `cabinId: string`, but the code accesses `.price`, `._id` on them (they're populated objects from the API)
- **Fix**: Update `Booking` interface to allow object shapes for `seatId` and `cabinId`

### 7. `AdminPayout` type: `bankDetails` not inside `vendorId`
- **File affected**: `AdminPayouts.tsx`
- **Problem**: `AdminPayout.vendorId` only has `{id, businessName, email, phone}` — `bankDetails` is a top-level field on `AdminPayout`, not nested inside `vendorId`
- **Fix**: Update references in `AdminPayouts.tsx` to use `row.original.bankDetails` instead of `row.original.vendorId.bankDetails`

### 8. `AdminVendorDocument`: `vendorId` type mismatch
- **File affected**: `VendorDetailsDialog.tsx` line 501
- **Problem**: Code tries to assign an object with `vendorId: string` but the type expects `vendorId: { _id, businessName, ... }`
- **Fix**: Cast or adjust the assignment with proper type handling

### 9. `Review` type: missing `userData` and `entityData` fields
- **File affected**: `ReviewsManagement.tsx`
- **Problem**: Local `Review` interface doesn't include `userData` or `entityData`, but the component uses them (populated from API)
- **Fix**: Extend the local `Review` interface with optional `userData` and `entityData` fields, and fix the `location.area.name` access with optional chaining

### 10. `StudentExcelImport.tsx`: Type errors with `BulkBookingData`
- **Problem**: `startDate`/`endDate` are `Date` objects but `BulkBookingData` expects `string`; `amount`/`key_deposite` are `string | number` but type expects `string`; status types mismatch
- **Fix**: Update `BulkBookingData` interface in `bulkBookingService.ts` to widen types to accept `Date | string` and `string | number`, and fix the status type

### 11. `SeatLayoutEditor.tsx` and `SeatManagement.tsx`: `number` not assignable to `string`
- **Problem**: Functions expecting `string` IDs are being passed `number` values
- **Fix**: Convert number to string with `.toString()` at the call sites

### 12. `HostelRoomForm.tsx`: Property access on `unknown` type
- **Problem**: Accessing `.length` and `.map()` on a property typed as `unknown`
- **Fix**: Cast to appropriate array type before accessing properties

## Technical Implementation Plan

### Files to Modify

```text
1.  src/components/RoomSeatButton.tsx         — Add RoomSeatButton component export
2.  src/data/bookingData.ts                   — Export BookingPlan interface
3.  src/api/adminRoomsService.ts              — Export RoomData interface
4.  src/utils/currency.ts                     — Add formatCurrency export function
5.  src/main.tsx                              — Remove virtual:pwa-register import/usage
6.  src/types/BookingTypes.ts                 — Widen seatId/cabinId types to allow objects
7.  src/pages/admin/AdminPayouts.tsx          — Fix bankDetails access path
8.  src/components/admin/VendorDetailsDialog.tsx — Fix vendorId type mismatch
9.  src/pages/admin/ReviewsManagement.tsx     — Add userData/entityData to Review interface
10. src/api/bulkBookingService.ts             — Widen BulkBookingData types
11. src/components/admin/StudentExcelImport.tsx — Fix status type assignments & math operators
12. src/components/hostel-manager/SeatLayoutEditor.tsx — Convert number to string
13. src/pages/SeatManagement.tsx              — Convert number to string
14. src/components/admin/HostelRoomForm.tsx   — Cast unknown to array type
```

### Order of Implementation
1. Fix type definitions first (interfaces/types in service files and types files)
2. Fix component-level issues after types are corrected
3. All changes are isolated TypeScript fixes — no logic changes, no UI changes
