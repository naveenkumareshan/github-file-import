

## Fix: Actually Hide Scrollbar on Student Pages

### Problem
The `no-scrollbar` class was added to `MobileAppLayout`'s inner `div` and `main`, but the visible scrollbar belongs to the **browser's root scroll container** (`html`/`body`). The global `::-webkit-scrollbar` styles (lines 110-127 in `index.css`) actively style that root scrollbar, and adding `no-scrollbar` to child elements has no effect on it.

### Solution
Make the `MobileAppLayout` container the actual scroll container instead of the body, so the `no-scrollbar` class works.

**File: `src/components/student/MobileAppLayout.tsx`**

Change the root div from `min-h-screen` (which lets the body scroll) to `h-screen overflow-hidden`, and make the `main` element the scroll container with `overflow-y-auto`:

```tsx
<div className="h-screen flex flex-col bg-background overflow-hidden">
  <main className="flex-1 overflow-y-auto pb-16 no-scrollbar">
    <Outlet />
  </main>
  <MobileBottomNav />
</div>
```

This way:
- The `body` no longer scrolls (no root scrollbar)
- The `main` element scrolls internally, and `no-scrollbar` hides its scrollbar
- Touch scrolling still works normally

| File | Change |
|------|--------|
| `src/components/student/MobileAppLayout.tsx` | Use `h-screen overflow-hidden` on root, `overflow-y-auto no-scrollbar` on main |

