
# Fix: Network Errors, Missing Student Dashboard, Home Page, & Profile Redesign

## Root Cause Analysis

### Issue 1 — Network Error on Cabin Search (and all student data pages)
The console log confirms:
```
AxiosError: Network Error → baseURL: "http://localhost:5000/api" → url: "/cabins/filter"
```
`src/api/cabinsService.ts` still uses Axios calling `localhost:5000`. Same for `bookingsService.ts`. These must be rewritten to use the Lovable Cloud (Supabase) database directly. The `cabins` and `bookings` tables need to be created in the database.

### Issue 2 — Student Dashboard Missing from Nav
`/student/dashboard` exists in routing but the Profile tab in `MobileBottomNav` goes to `/student/profile` — there is no link to the dashboard anywhere in the bottom nav or home page when logged in. The student dashboard (`StudentDashboard.tsx`) also still uses old Axios-based `bookingsService` calls that will fail.

### Issue 3 — Home Page Not Personalized / No Current Bookings
`Index.tsx` only shows a generic greeting. It does not show the user's active bookings. For unauthenticated users it shows the same static page. Need to split: logged-in students see a personalized dashboard-style home with their active booking card; logged-out users see the marketing/public home.

### Issue 4 — Profile Is Complex / No Collapsible Sections
`ProfileManagement.tsx` shows all 13 fields at once with no grouping. The request is: sections for "Account", "Personal Info", "Academic Info", collapsible, with a clear "Save" flow. Also the profile tab should show a "My Bookings" mini-widget.

### Issue 5 — Profile Page Needs "My Bookings" Section
The Profile page (`src/pages/Profile.tsx`) currently only renders `<ProfileManagement />`. Need to add a bookings summary section.

---

## Database Migration Required

Two tables must be created so the student-side pages load real data without hitting localhost:

**`cabins` table** — for the Reading Rooms search page:
- `id uuid`, `name text`, `category text` (standard/premium/luxury), `description text`, `price numeric`, `capacity int`, `amenities text[]`, `image_url text`, `city text`, `state text`, `area text`, `is_active boolean`, `created_at timestamptz`

**`bookings` table** — for student dashboard, home page, profile bookings:
- `id uuid`, `user_id uuid`, `cabin_id uuid`, `seat_number int`, `start_date date`, `end_date date`, `months int`, `total_price numeric`, `payment_status text`, `booking_duration text`, `duration_count text`, `created_at timestamptz`

**RLS Policies:**
- `cabins`: public SELECT for active cabins (no auth needed for browsing)
- `bookings`: students can only SELECT/INSERT their own rows (`user_id = auth.uid()`)

---

## Files to Change

### 1. `src/api/cabinsService.ts` — Rewrite to Supabase
Replace all Axios calls with Supabase queries:
```typescript
import { supabase } from '@/integrations/supabase/client';

getAllCabins: async (filters?) => {
  let query = supabase.from('cabins').select('*').eq('is_active', true);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
  if (filters?.minPrice) query = query.gte('price', filters.minPrice);
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
  // pagination using .range()
  const from = ((filters?.page || 1) - 1) * (filters?.limit || 10);
  query = query.range(from, from + (filters?.limit || 10) - 1);
  const { data, error, count } = await query;
  return { success: !error, data: data || [], count: count || 0 };
}
```

### 2. `src/api/bookingsService.ts` — Rewrite to Supabase
```typescript
getUserBookings: async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('bookings')
    .select('*, cabins(name, category)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return { success: !error, data };
}
getCurrentBookings: async () => {
  // bookings where end_date >= today and payment_status = 'completed'
}
```

### 3. `src/pages/Index.tsx` — Personalized Home for Logged-In Students
Split into two modes:

**When authenticated** — show:
- Greeting header: "Good morning, Arjun 👋" with avatar initials
- Active booking card (if any): cabin name, seat #, days remaining, "Renew" button
- Quick action tiles: Book Room / Find Hostel / My Bookings / Laundry
- No testimonials/how-it-works (those are for non-users)

**When not authenticated** — show current public marketing page (no change):
- Hero with stats
- CTA tiles
- Features, How It Works, Testimonials

This is done by checking `isAuthenticated` and rendering two different JSX trees within the same component.

### 4. `src/pages/Profile.tsx` — Add My Bookings Section
Add a "My Bookings" summary below `ProfileManagement`:
- 2 most recent bookings in compact cards
- "View All" → `/student/bookings`
- Loading skeleton while fetching

### 5. `src/components/profile/ProfileManagement.tsx` — Collapsible Sections
Replace the flat list of 13 fields with 3 collapsible `Accordion` sections:

**Section 1 — Account** (always expanded by default):
- Name, Email, Phone, Alternate Phone, Gender (avatar + edit toggle)

**Section 2 — Personal Info** (collapsed by default):
- Date of Birth, Address, City, State, Pincode

**Section 3 — Academic Info** (collapsed by default):
- Course Preparing For, Course Studying, College/University, Parent Mobile, Bio

Each section has its own "Edit / Save / Cancel" logic — or a single global edit toggle with one Save button at the bottom (simpler). Going with the **single Save button approach** for simplicity and UX consistency:
- "Edit Profile" button at top → all fields become editable
- After editing, "Save Changes" / "Cancel" appear
- Photo upload only shows in edit mode

### 6. `src/components/student/MobileBottomNav.tsx` — Add Dashboard Tab
The Profile tab currently links to `/student/profile`. When a user is logged in, the tab flow should be:
- Tapping "Profile" still goes to `/student/profile`
- But the **home page** (when authenticated) shows a prominent "My Bookings" quick action tile linking to `/student/bookings`

No change needed to the nav itself — the home page change covers the dashboard discovery problem.

---

## What the Authenticated Home Page Will Look Like

```text
┌────────────────────────────────┐
│ [logo] InhaleStays    [👤 A]   │  ← top bar
├────────────────────────────────┤
│                                │
│  Good morning, Arjun 👋        │  ← personalized greeting
│                                │
│  ┌──────────────────────────┐  │
│  │ 🏠 Current Booking       │  │  ← active booking card (from DB)
│  │ Study Hub - Seat #12     │  │
│  │ Expires: 15 Mar · 23 days│  │
│  │          [Renew]         │  │
│  └──────────────────────────┘  │
│                                │
│  Quick Actions                 │
│  [📚 Book Room] [🏨 Hostels]   │
│  [📋 Bookings ] [🧺 Laundry]  │
│                                │
│  ─── Why InhaleStays? ─────── │
│  (feature cards, compact)      │
│                                │
├────────────────────────────────┤
│ 🏠   📚   🏨   👤            │  ← bottom nav
└────────────────────────────────┘
```

---

## File Summary

| File | Action | Reason |
|---|---|---|
| DB Migration | CREATE cabins + bookings tables | Fix Network Error |
| `src/api/cabinsService.ts` | REWRITE → Supabase | Fix AxiosError on /cabins/filter |
| `src/api/bookingsService.ts` | REWRITE → Supabase | Fix student dashboard data |
| `src/pages/Index.tsx` | UPDATE — split auth/unauth views | Personalized home + active booking |
| `src/pages/Profile.tsx` | UPDATE — add My Bookings section | User request #5 |
| `src/components/profile/ProfileManagement.tsx` | UPDATE — collapsible Accordion sections | User request #4 |

## What Is NOT Changed
- Admin pages, vendor pages — untouched
- `AuthContext.tsx` — no changes needed
- `CabinSearch.tsx` — only the service layer changes, page logic stays
- `MobileBottomNav.tsx` — no changes needed
- Routing in `App.tsx` — no changes needed
- All other student pages — untouched
