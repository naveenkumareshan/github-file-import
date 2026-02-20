
## Direct Implementation — All 9 Points at Once

The root cause: every previous attempt entered plan mode and then got stuck waiting for a database migration approval. This plan will implement all changes directly across all files simultaneously.

### What I will build

**New files to create (6):**
1. `src/pages/PrivacyPolicy.tsx` — gradient hero + card sections
2. `src/pages/TermsAndConditions.tsx` — same style
3. `src/components/home/HomeBanner.tsx` — auto-sliding carousel from `banners` DB table
4. `src/components/admin/BannerManagement.tsx` — upload/manage banners
5. `src/pages/admin/BannerManagement.tsx` — admin wrapper page
6. Database migration — `banners` table with RLS + storage bucket

**Files to update (7):**
1. `src/components/student/MobileBottomNav.tsx` — "Rooms" → "Study Rooms"
2. `src/pages/Index.tsx` — grid-cols-2 fix + HomeBanner + auto-carousel for "Why InhaleStays"
3. `src/components/profile/ProfileManagement.tsx` — per-section edit, My Bookings inside, logout, legal links
4. `src/pages/Profile.tsx` — simplify (My Bookings moves inside ProfileManagement)
5. `src/App.tsx` — add /privacy-policy, /terms, /admin/banners routes
6. `src/components/admin/AdminSidebar.tsx` — add Banners menu item
7. `src/pages/Hostels.tsx` — sticky header + filter drawer UI

### Key technical decisions

**Banners DB:** Simple table — `id`, `title`, `subtitle`, `image_url`, `link_url`, `is_active`, `display_order`. Public SELECT on active banners. Admin full access via `has_role`.

**HomeBanner fallback:** When no banners exist in DB, shows a default branded gradient slide so the carousel always has content.

**Per-section editing:** Replace global `isEditing` with `editingSection: string | null` and `sectionDraft` state. Each accordion section gets its own Edit/Save/Cancel buttons in the trigger header.

**My Bookings in ProfileManagement:** The bookings fetch moves from `Profile.tsx` into `ProfileManagement.tsx`. It renders between the avatar header card and the accordion sections.

**Logout:** Uses `logout()` from `useAuth()` — already confirmed this exists in AuthContext.

**"Why InhaleStays" carousel:** Replace `overflow-x-auto` with `translateX` CSS animation carousel + dot indicators. Applied to both `AuthenticatedHome` and `GuestHome`.
