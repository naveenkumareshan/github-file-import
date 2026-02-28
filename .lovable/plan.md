

## Add "View Details" Button to Reported Today Section

Add the same "View Details" eye icon button to each row in the "Reported Today" collapsible table, reusing the existing `CheckInViewDetailsDialog` component.

### Changes

**Modified file: `src/components/admin/operations/ReportedTodaySection.tsx`**

1. Import `Eye` from lucide-react and `CheckInViewDetailsDialog`
2. Add `viewBooking` and `viewDialogOpen` state
3. Add a new "Actions" column header after "Notes"
4. Add an Eye button in each row that sets `viewBooking` and opens the dialog
5. Render `CheckInViewDetailsDialog` at the bottom, passing the selected booking and module

The dialog will show the same format: student info, booking details, payment, and attached documents list.

