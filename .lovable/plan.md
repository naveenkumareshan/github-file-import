

# Fix: Blank Pages & Slow Loading in Admin/Partner Panel

## Root Causes Identified

1. **`<Outlet key={location.pathname} />`** in `AdminLayout.tsx` forces a **full component remount** on every navigation. This destroys and recreates the entire child page, making navigation feel extremely slow and causing blank flashes.

2. **No Suspense boundary around child routes** — All admin/partner child routes use `lazy()` imports, but there is no `<Suspense>` wrapping the `<Outlet>`. When a lazy component is loading, React has nothing to render, resulting in a blank screen.

## Fix (Single File Change)

**File: `src/components/AdminLayout.tsx`**

- **Remove** `key={location.pathname}` from `<Outlet />` — this eliminates the forced remount on every navigation, making page transitions instant when components are already loaded.
- **Wrap** `<Outlet />` in a `<Suspense>` with a centered spinner fallback — so lazy-loaded child routes show a loading indicator instead of a blank screen.

```tsx
// Before
<Outlet key={location.pathname} />

// After
<Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
  <Outlet />
</Suspense>
```

This single change fixes both the blank page issue and the slow navigation. Pages will:
- Show a spinner while first loading (lazy import)
- Navigate instantly once cached (no remount)
- Preserve component state during tab switches within the same page

