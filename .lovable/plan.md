

## Fix: Partner Mobile App Blank Pages on Navigation

### Root Cause
The `PartnerMobileLayout` renders `<Outlet />` without a `<Suspense>` boundary. All child route components (Dashboard, Bookings, Seat Map, etc.) are lazy-loaded via `React.lazy()`. When a user taps any nav item on mobile, React tries to load the lazy component but there's no Suspense fallback to show while loading -- this causes an uncaught error and a blank page.

The desktop layout (`AdminLayout`) correctly wraps its `<Outlet />` in `<Suspense>` with a spinner fallback (line 104), which is why desktop works fine.

### Fix

**`src/components/partner/PartnerMobileLayout.tsx`** -- Wrap `<Outlet />` in `<Suspense>` with a loading spinner, matching what AdminLayout does:

```tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// In the JSX:
<main className="flex-1 overflow-y-auto pb-16 no-scrollbar">
  <Suspense fallback={
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  }>
    <Outlet />
  </Suspense>
</main>
```

This is a one-file, ~3-line change that will fix all blank page issues across the entire partner mobile app.

