

## Plan: Compact Property Names with Tooltip

### Approach
Instead of showing only the first word (which could be ambiguous — e.g., multiple properties starting with "Toppers"), use **CSS truncation with ellipsis** and a **hover tooltip** showing the full name. This is a cleaner UX pattern that saves space without losing information.

```
Before: Toppers reading room / F2 · S60
After:  Toppers readi… / F2 · S60  (hover shows full name)
```

### Changes

Apply `max-w-[100px] truncate inline-block` to the property name span, wrapped in a `<Tooltip>` from the existing UI library.

| File | Change |
|------|--------|
| `src/pages/AdminBookings.tsx` | Truncate cabin/hostel name with tooltip |
| `src/pages/admin/ExpiringBookingsPage.tsx` | Same |
| `src/pages/admin/Receipts.tsx` | Same |
| `src/pages/admin/DueManagement.tsx` | Same |
| `src/components/admin/AdminBookingsList.tsx` | Same |
| `src/components/admin/operations/ReportedTodaySection.tsx` | Same |
| `src/components/admin/operations/CheckInTracker.tsx` | Same |
| `src/components/booking/BookingTransactionView.tsx` | Same |

Each property name gets wrapped like:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="max-w-[100px] truncate inline-block align-bottom">
      {cabin?.name}
    </span>
  </TooltipTrigger>
  <TooltipContent>{cabin?.name}</TooltipContent>
</Tooltip>
```

This reduces the property name column by ~40-60% while keeping full info accessible on hover.

