
## Root Cause Found + Immediate Fix

The issue is clear: every previous attempt was in **plan mode** — which is READ-ONLY and cannot write files. That's why nothing ever got implemented. The database migration tool was being called but plan mode cannot execute it. Now I'm in **implementation mode** and will make ALL changes directly.

## What I'll implement right now:

### 1. Database migration — `banners` table + storage bucket
SQL to create the table, enable RLS, and create the storage bucket.

### 2. New files (6):
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/TermsAndConditions.tsx`
- `src/components/home/HomeBanner.tsx`
- `src/components/admin/BannerManagement.tsx`
- `src/pages/admin/BannerManagement.tsx`
- `supabase/migrations/[timestamp]_banners.sql`

### 3. Updated files (7):
- `src/components/student/MobileBottomNav.tsx` — "Rooms" → "Study Rooms"
- `src/pages/Index.tsx` — grid-cols-2 fix + HomeBanner + auto-carousel
- `src/components/profile/ProfileManagement.tsx` — per-section edit, My Bookings, logout, legal links
- `src/pages/Profile.tsx` — simplify
- `src/App.tsx` — add routes
- `src/components/admin/AdminSidebar.tsx` — add Banners link
- `src/pages/Hostels.tsx` — sticky header + filter drawer

All 13 changes will be implemented in a single pass.
