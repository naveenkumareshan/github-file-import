
## Fix: Pages Showing Stale/Old Content on Navigation

Your code is NOT broken or damaged. There are two specific technical issues causing pages to appear "stuck" or show old content when you navigate between them.

### What's Happening

**Issue 1: No chunk error recovery for admin pages**
When the app updates (new deployment/hot reload), the browser may have cached old JavaScript chunks. When you navigate to a lazy-loaded page, it tries to load the old chunk which no longer exists, causing a silent failure. Student pages have error boundaries but admin pages inside the sidebar layout do NOT have individual error recovery -- so the page just shows a loading spinner forever or goes blank.

**Issue 2: Missing `key` prop on admin route outlet**
When navigating between admin pages, React may reuse the same component tree instead of unmounting/remounting. This can cause pages to show stale state from the previous page visit because `useState` values persist.

### Fix Plan

**1. Add chunk error auto-recovery (ErrorBoundary.tsx)**
Update the ErrorBoundary to detect chunk loading errors (`ChunkLoadError` / `Loading chunk`) and automatically reload the page once, so users never see stale cached chunks.

**2. Wrap admin Outlet with route-aware key (AdminLayout.tsx)**
Add `key={location.pathname}` to the `<Outlet />` so React fully unmounts and remounts the page component on every route change. This ensures fresh state every time.

**3. Wrap each admin lazy route with Suspense + ErrorBoundary (App.tsx)**
Add individual `<Suspense>` wrappers around lazy-loaded admin page routes (similar to how student pages use `<StudentSuspense>`), so chunk loading failures are caught per-page instead of breaking the entire admin panel.

**4. Make HostelManagement lazy-loaded (App.tsx)**
`AdminHostels` is currently imported eagerly (direct import) unlike all other admin pages. Convert it to `lazy()` for consistency and to benefit from error recovery.

### Technical Details

**Files to modify:**
- `src/components/ErrorBoundary.tsx` -- Add chunk error detection and auto-reload
- `src/components/AdminLayout.tsx` -- Add `key={location.pathname}` on Outlet
- `src/App.tsx` -- Convert `AdminHostels` to lazy import; no other changes needed since AdminLayout already has a parent Suspense

These are small, surgical fixes that won't affect any existing functionality.
