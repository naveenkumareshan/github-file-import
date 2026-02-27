

## Fix Blank Pages on Reading Room and Booking Card Click (Student Side)

### Problem
When a student clicks on a reading room card (`/book-seat/:id`) or a booking detail card (`/student/bookings/:id`), the page goes blank. This is caused by lazy-loaded components failing silently without an error boundary to catch and display a fallback UI.

### Root Cause
In `src/App.tsx`, the student routes use `StudentSuspense` (Suspense with a basic "Loading..." fallback) but have **no ErrorBoundary**. If a lazy-loaded chunk fails to load (network issue, cache invalidation) or the component throws a runtime error, the entire page crashes to blank.

### Fix

**File: `src/App.tsx`**

1. Create a `StudentErrorBoundary` wrapper that combines `ErrorBoundary` + `Suspense` for all student/public lazy routes.
2. Wrap the `StudentSuspense` component with `ErrorBoundary` so that chunk load failures and runtime errors show a user-friendly error screen with a "Retry" button instead of a blank page.
3. Update the Suspense fallback to show a proper loading skeleton instead of just text.

**Changes:**
- Import `ErrorBoundary` from `@/components/ErrorBoundary`
- Update `StudentSuspense` to wrap children in both `ErrorBoundary` and `Suspense`:

```tsx
const StudentSuspense = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      {children}
    </Suspense>
  </ErrorBoundary>
);
```

This single change wraps ALL student and public routes with error recovery, preventing blank pages throughout the app.

### Technical Details

| File | Change |
|------|--------|
| `src/App.tsx` | Import `ErrorBoundary` and `Loader2`; update `StudentSuspense` to wrap with ErrorBoundary and use a spinner fallback |

### Result
- If a lazy chunk fails to load, the error boundary shows "Something went wrong" with a "Try Again" button
- If a component throws a runtime error, users see the error message instead of a blank page
- The loading state shows a centered spinner instead of plain text
