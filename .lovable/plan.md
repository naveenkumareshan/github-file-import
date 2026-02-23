

## Fix: Blank Pages Due to Missing Skeleton Import

### Root Cause
Two files crash with `ReferenceError: Skeleton is not defined` because the `Skeleton` component is used but never imported. This causes the entire page to go white/blank.

### Changes

**1. `src/components/admin/VendorApproval.tsx`**
- Add missing import: `import { Skeleton } from '@/components/ui/skeleton';`

**2. `src/components/admin/AdminBookingsList.tsx`**
- Add missing import: `import { Skeleton } from '@/components/ui/skeleton';`

**3. Remove the 5-second loading timeout behavior**
- In `src/hooks/use-loading-timeout.ts`: Keep the hook but set a much shorter default (e.g., 500ms) or remove the timeout display entirely
- In any components using `useLoadingTimeout` (DynamicStatisticsCards, DashboardStatistics, StudentDashboard, VendorApproval): Remove the timeout-based "Unable to load" overlay so pages load immediately without a forced wait

These two import fixes will immediately resolve the blank/white page crashes. The timeout removal will stop the "Loading..." delay behavior.

