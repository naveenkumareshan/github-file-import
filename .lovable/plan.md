

## Plan: Optimize App Performance

The app has several performance bottlenecks across font loading, caching headers, redundant network calls, and bundle size. Here is the prioritized fix list.

### Root Causes Found

1. **Google Fonts loaded synchronously** — Render-blocking CSS in `index.html` delays first paint
2. **Anti-caching meta tags** — `no-cache, no-store, must-revalidate` headers in `index.html` prevent the browser from caching ANY assets (JS, CSS, images), forcing full re-downloads on every page visit
3. **Redundant `supabase.auth.getUser()` calls** — Found in 14+ files; each is a network round-trip. The user is already available from `AuthContext` but many components call `getUser()` independently (AdminSidebar avatar fetch, complaints, support tickets, vendor profiles, etc.)
4. **Splash screen blocks for 2.1 seconds** — Even when cached branding is available, the splash shows for 1.5s before fading. This can be shortened.
5. **ExcelJS imported eagerly** in 5 files — This is a heavy library (~800KB) that should only load when the user clicks an export/import button, not on page load. Currently lazy-loaded pages import it at the top level, so it loads with those pages.

### Implementation

**1. Fix index.html — Font loading + caching**
- Add `media="print" onload="this.media='all'"` to the Google Fonts link for non-blocking load
- Remove the aggressive no-cache meta tags — Vite already hashes JS/CSS filenames for cache-busting. These tags are actively harming performance by preventing the browser from caching static assets.

**2. Replace `supabase.auth.getUser()` with `useAuth()` context**
In these key files, replace the network call with the already-available `user` from AuthContext:
- `AdminSidebar.tsx` — avatar fetch uses `getUser()` then queries profiles; use `user.id` from context instead
- `SupportTicketsManagement.tsx`, `ComplaintsManagement.tsx`, `SupportPage.tsx`, `ComplaintsPage.tsx` — each calls `getUser()` on load; use `useAuth()` instead
- `ProfileManagement.tsx` — calls `getUser()` for email verification check; use context
- `HostelDeposits.tsx` — calls `getUser()` in payment handler

This eliminates ~10-15 redundant network round-trips per session.

**3. Dynamic import ExcelJS**
In the 5 files that import ExcelJS at the top level, change to dynamic `import('exceljs')` inside the export/import handler functions. This removes ~800KB from each page's initial chunk.

**4. Reduce splash duration**
- When cached branding is available (which it usually is after first visit), reduce splash to 800ms instead of 1500ms. This saves ~700ms on every app open.

**5. QueryClient already well-configured** — `staleTime: 5min`, `refetchOnWindowFocus: false`, `retry: 1` are all good. No changes needed here.

### Files to modify
- `index.html` — font preload, remove no-cache
- `src/components/SplashOverlay.tsx` — shorter duration when cached
- `src/components/admin/AdminSidebar.tsx` — use AuthContext instead of getUser()
- `src/components/profile/SupportPage.tsx` — use AuthContext
- `src/components/profile/ComplaintsPage.tsx` — use AuthContext
- `src/components/admin/SupportTicketsManagement.tsx` — use AuthContext
- `src/components/admin/ComplaintsManagement.tsx` — use AuthContext
- `src/components/profile/ProfileManagement.tsx` — use AuthContext
- `src/pages/admin/HostelDeposits.tsx` — use AuthContext
- `src/components/admin/StudentExcelImport.tsx` — dynamic import ExcelJS
- `src/components/admin/reports/ExportReportButton.tsx` — dynamic import ExcelJS
- `src/components/admin/reports/BookingTransactions.tsx` — dynamic import ExcelJS
- `src/pages/partner/PartnerEarnings.tsx` — dynamic import ExcelJS
- `src/pages/admin/PartnerSettlements.tsx` — dynamic import ExcelJS

