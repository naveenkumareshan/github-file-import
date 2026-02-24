

## Fix Blank Pages and Reduce Loading Time

### Root Cause

The blank pages are caused by a build-breaking bug in `BookingTransactionView.tsx`:

1. **Duplicate import on line 10**: The same lucide-react icons are imported twice (lines 9 and 10), causing a JavaScript error
2. **Missing Card/CardContent import**: The loading spinner (lines 131-136) still uses `Card` and `CardContent` components, but these imports were removed in the previous edit -- this causes "Component is not a function" crash

### Fix Plan

**File: `src/components/booking/BookingTransactionView.tsx`**

1. Remove the duplicate import on line 10
2. Replace `Card`/`CardContent` usage in the loading spinner (lines 131-136) with a plain `div`, matching the rest of the mobile-friendly layout

These are the only changes needed. Once the duplicate import and missing component references are fixed, the app will render correctly again.

