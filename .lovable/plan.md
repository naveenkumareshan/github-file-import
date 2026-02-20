
# Status: Not Done — Full Implementation Required

None of the approved plan items have been executed yet. Here is exactly what will be built now:

---

## What's Missing (Current State)

| Item | Current State |
|---|---|
| `cabinsService.ts` | Still calls `axios` → `localhost:5000/api/cabins/filter` |
| `bookingsService.ts` | Still calls `axios` → `localhost:5000/api/bookings` |
| `userProfileService.ts` | Still calls `axios` → `localhost:5000/api/users/profile` |
| `cabins` table | Does NOT exist in the database |
| `bookings` table | Does NOT exist in the database |
| `profiles` table | Does NOT exist (needed for extended profile data) |
| `Index.tsx` | Shows same static page for all users — no personalization, no active booking card |
| `Profile.tsx` | Just renders `<ProfileManagement />` — no bookings section |
| `ProfileManagement.tsx` | Flat 13-field form, no collapsible sections, calls old Axios service |

---

## Step 1 — Database Tables (3 tables)

### `cabins` table
Stores reading rooms that students can browse and book:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `name text NOT NULL`
- `category text` (standard / premium / luxury)
- `description text`
- `price numeric DEFAULT 0`
- `capacity int DEFAULT 0`
- `amenities text[]`
- `image_url text`
- `city text`, `state text`, `area text`
- `is_active boolean DEFAULT true`
- `created_at timestamptz DEFAULT now()`

RLS: Public SELECT (no auth required for browsing).

### `bookings` table
Stores student seat bookings:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id uuid NOT NULL` (references auth user id)
- `cabin_id uuid REFERENCES cabins(id)`
- `seat_number int`
- `start_date date`
- `end_date date`
- `total_price numeric DEFAULT 0`
- `payment_status text DEFAULT 'pending'`
- `booking_duration text`
- `duration_count text`
- `created_at timestamptz DEFAULT now()`

RLS: Students can only SELECT/INSERT their own rows (`auth.uid() = user_id`).

### `profiles` table
Stores extended student profile data (name, phone, address, etc.) that Supabase auth doesn't store:
- `id uuid PRIMARY KEY` (same as auth user id)
- `name text`
- `email text`
- `phone text`, `alternate_phone text`
- `address text`, `city text`, `state text`, `pincode text`
- `date_of_birth date`
- `gender text`
- `bio text`
- `course_preparing_for text`
- `course_studying text`
- `college_studied text`
- `parent_mobile_number text`
- `profile_picture text`
- `profile_edit_count int DEFAULT 0`
- `created_at timestamptz DEFAULT now()`
- `updated_at timestamptz DEFAULT now()`

RLS: Users can only read/update their own row.

---

## Step 2 — Rewrite `src/api/cabinsService.ts`

Replace all Axios calls with Supabase queries:

```typescript
import { supabase } from '@/integrations/supabase/client';

getAllCabins: async (filters?) => {
  let query = supabase.from('cabins').select('*', { count: 'exact' }).eq('is_active', true);
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.search)   query = query.ilike('name', `%${filters.search}%`);
  if (filters?.minPrice) query = query.gte('price', filters.minPrice);
  if (filters?.maxPrice) query = query.lte('price', filters.maxPrice);
  if (filters?.city)     query = query.ilike('city', `%${filters.city}%`);
  const from = ((filters?.page || 1) - 1) * (filters?.limit || 20);
  query = query.range(from, from + (filters?.limit || 20) - 1);
  const { data, error, count } = await query;
  return { success: !error, data: data || [], count: count || 0 };
}

getCabinById: async (id) => {
  const { data, error } = await supabase.from('cabins').select('*').eq('id', id).single();
  return { success: !error, data };
}

getFeaturedCabins: async () => {
  const { data, error } = await supabase.from('cabins').select('*').eq('is_active', true).limit(6);
  return { success: !error, data: data || [] };
}
```

---

## Step 3 — Rewrite `src/api/bookingsService.ts`

Replace all Axios calls with Supabase:

```typescript
import { supabase } from '@/integrations/supabase/client';

getUserBookings: async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, data: [] };
  const { data, error } = await supabase.from('bookings')
    .select('*, cabins(name, category, image_url, city, area)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return { success: !error, data: data || [] };
}

getCurrentBookings: async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, data: [] };
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('bookings')
    .select('*, cabins(name, category, image_url)')
    .eq('user_id', user.id)
    .gte('end_date', today)
    .eq('payment_status', 'completed')
    .order('end_date', { ascending: true });
  return { success: !error, data: data || [] };
}

createBooking: async (bookingData) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('bookings')
    .insert({ ...bookingData, user_id: user.id })
    .select().single();
  return { success: !error, data };
}
```

---

## Step 4 — Rewrite `src/api/userProfileService.ts`

Replace all Axios calls with Supabase `profiles` table:

```typescript
getUserProfile: async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('profiles')
    .select('*').eq('id', user.id).single();
  
  // If no profile row yet, return defaults from auth metadata
  if (error || !data) {
    return { success: true, data: {
      name: user.user_metadata?.name || '',
      email: user.email || '',
      ...defaults
    }};
  }
  return { success: true, data };
}

updateProfile: async (profileData) => {
  const { data: { user } } = await supabase.auth.getUser();
  // upsert so it works even if no row exists yet
  const { error } = await supabase.from('profiles')
    .upsert({ id: user.id, ...profileData, updated_at: new Date().toISOString() });
  return { success: !error };
}
```

---

## Step 5 — Redesign `src/pages/Index.tsx`

Split into two different views based on `isAuthenticated`:

**Authenticated student view:**
```
┌────────────────────────────────────┐
│  Good morning, Arjun 👋            │  ← greeting with first name
│  student@inhalestays.com           │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📚 Active Booking            │  │  ← fetched from bookings table
│  │ Study Hub Premium            │  │
│  │ Seat #12  ·  Expires 15 Mar  │  │
│  │ 23 days remaining  [Renew →] │  │
│  └──────────────────────────────┘  │
│  (if no booking: "No active        │
│   booking — Book a Room →")        │
│                                    │
│  Quick Actions (2×2 grid):         │
│  [📚 Book Room] [🏨 Hostels]       │
│  [📋 My Bookings] [🧺 Laundry]    │
│                                    │
│  Why InhaleStays? (feature cards)  │
└────────────────────────────────────┘
```

**Guest/unauthenticated view** (same as current marketing page — hero, stats, CTA tiles, how it works, testimonials).

---

## Step 6 — Redesign `src/components/profile/ProfileManagement.tsx`

Replace the flat 13-field form with **3 collapsible Accordion sections** + a password change section:

**Section 1 — Account Info** (open by default):
- Avatar + Name, Email, Phone, Alternate Phone, Gender selector
- "Edit → Save / Cancel" single save flow

**Section 2 — Personal Info** (collapsed):
- Date of Birth, Address, City, State, Pincode

**Section 3 — Academic Info** (collapsed):
- Course Preparing For, Course Studying, College/University, Parent Mobile, Bio

**Section 4 — Security** (collapsed):
- Change Password fields (Current Password, New Password, Confirm)
- Uses `supabase.auth.updateUser({ password: newPassword })`

Profile data loaded from the new `profiles` table via the rewritten `userProfileService`.

---

## Step 7 — Update `src/pages/Profile.tsx`

Add a **"My Bookings" summary** section below `<ProfileManagement />`:
- Shows the 2 most recent bookings as compact horizontal cards
- Each card: cabin name, seat #, date range, payment status badge
- "View All Bookings →" link to `/student/bookings`
- Skeleton loading state while fetching
- Empty state if no bookings

---

## Files Changed

| File | Change |
|---|---|
| DB Migration | CREATE `cabins`, `bookings`, `profiles` tables with RLS |
| `src/api/cabinsService.ts` | Rewrite → Supabase |
| `src/api/bookingsService.ts` | Rewrite → Supabase |
| `src/api/userProfileService.ts` | Rewrite → Supabase profiles table |
| `src/pages/Index.tsx` | Split auth/guest views, active booking card |
| `src/pages/Profile.tsx` | Add My Bookings summary section |
| `src/components/profile/ProfileManagement.tsx` | Accordion sections + Supabase data |

## What Is NOT Changed
- Admin pages, vendor pages, routing, auth flows, bottom nav
- `BookingRenewal`, `RazorpayCheckout`, payment logic
- All other student pages (CabinSearch, Hostels, BookSeat, etc.)
