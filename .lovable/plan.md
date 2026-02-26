
## Simplify Admin Booking Detail Page

### Changes to `src/pages/AdminBookingDetail.tsx`

**1. Remove "Update Dates" and "Extend Booking" buttons**
- Remove the two buttons from the header (lines 154-165)
- Remove the `BookingExtensionDialog` and `BookingUpdateDatesDialog` components and their imports
- Remove related state variables (`showExtensionDialog`, `showUpdateBookingDatesDialog`) and handler functions

**2. Reorder layout: Student Details -> Booking Information -> Payment Receipts**
- Move the Student card (currently in the sidebar) to be the first card in the main content area
- Keep Booking Information as the second card
- Keep the Payment Receipts table as the third card (this is the comprehensive one showing all receipts with serial numbers, amounts, methods, dates)
- Remove the separate DuePaymentHistory card from the sidebar (it duplicates receipt info)
- Switch to a single-column layout since there's no sidebar anymore

**3. Remove unused imports**
- Remove `BookingExtensionDialog`, `BookingUpdateDatesDialog`, `DuePaymentHistory`, `vendorSeatsService` imports
- Remove `Clock` icon import
- Remove `dueData` state
