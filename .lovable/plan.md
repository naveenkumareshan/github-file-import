

# Move QR Buttons Into Property Cards + Ensure QR Stability

## Problem
1. QR buttons sit in a separate horizontal scroll bar at the top of ManageProperties — wastes space and causes confusion.
2. Need to ensure QR data is deterministic (always same output for same property) so printed QR codes never break.

## Changes

### 1. Remove QR scroll bar from `ManageProperties.tsx`
- Delete lines 141-150 (the `qrProperties` scroll bar section)
- Delete the `qrProperties` state, the `useEffect` that fetches them (lines 38, 86-101)
- Keep the QR dialog and `handleOpenQr`/`handleDownloadQr` functions but lift them to be triggerable from child components via a callback prop

### 2. Add QR button to `CabinItem.tsx`
- Accept a new prop `onDownloadQr?: (cabinId: string, cabinName: string) => void`
- Add a QR icon button in the actions row (next to WhatsApp button), calling `onDownloadQr(cabin._id, cabin.name)`
- Import `QrCode` from lucide-react

### 3. Add QR button to `HostelItem.tsx`
- Same pattern: accept `onDownloadQr?: (hostelId: string, hostelName: string) => void`
- Add QR icon button in actions row

### 4. Wire up in parent components
- In `RoomManagement.tsx` (renders CabinItem for reading rooms): pass down an `onDownloadQr` callback that opens the QR dialog
- In `HostelManagement.tsx` (renders HostelItem): same pattern
- The QR dialog stays in `ManageProperties.tsx` and gets triggered via state lifted from children through these callbacks. Alternatively, move QR generation logic into a shared hook or keep the dialog in ManageProperties and pass the open handler down.

### 5. QR data stability
The current QR encodes `JSON.stringify({ propertyId, type })`. This is deterministic — same property always produces the same QR. The `propertyId` is the database UUID which never changes. No fix needed here — the QR is already stable and will never change for a given property.

## Files Modified
- `src/pages/partner/ManageProperties.tsx` — remove top scroll bar, keep QR dialog, pass `onOpenQr` callback to child tabs
- `src/components/admin/CabinItem.tsx` — add QR button in actions
- `src/components/admin/HostelItem.tsx` — add QR button in actions
- `src/pages/RoomManagement.tsx` — pass `onDownloadQr` prop to CabinItem
- `src/pages/hotelManager/HostelManagement.tsx` — pass `onDownloadQr` prop to HostelItem

