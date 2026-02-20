
# Status: NOT Done — Full Implementation Now

None of the 9 plan items have been executed. Here is the complete build plan that will be implemented now.

---

## What's Missing vs. What Exists

| # | Change | Current State |
|---|---|---|
| 1 | Legal pages (Privacy, Terms, About) | Pages don't exist; no routes in App.tsx |
| 2 | Quick action alignment fix | Still `grid-cols-4` — "My Bookings" text overflows |
| 3 | Homepage banner + Admin management | No `banners` table, no component, no admin page |
| 4 | Hostel UI = Reading Rooms UI | Old basic search, no sticky header or filter drawer |
| 5 | "Rooms" → "Study Rooms" in nav | Still says "Rooms" in MobileBottomNav.tsx |
| 6 | My Bookings moved above Account Info | Currently rendered in Profile.tsx BELOW ProfileManagement |
| 7 | Logout button at bottom of profile | Missing entirely |
| 8 | Per-section edit/save | Global `isEditing` toggle, single Save for all sections |
| 9 | Auto-swipe "Why InhaleStays" | Static horizontal scroll with `overflow-x-auto` |

---

## Step 1 — Database: Create `banners` table

New table with these columns:
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- `title text`
- `subtitle text`
- `image_url text NOT NULL`
- `link_url text`
- `is_active boolean DEFAULT true`
- `display_order int DEFAULT 0`
- `created_at timestamptz DEFAULT now()`

RLS policies:
- Anyone can SELECT where `is_active = true`
- Admins (via `has_role`) can INSERT / UPDATE / DELETE

Also create a `banners` storage bucket for image uploads.

---

## Step 2 — New Files to Create

### `src/pages/PrivacyPolicy.tsx`
Mobile-first page with gradient hero header and Card sections covering:
- What data we collect (name, email, phone, academic info)
- How we use it (bookings, seat allocation, communications)
- Data security (encrypted storage, no third-party sale)
- Cookies and session data
- Contact information for data requests

### `src/pages/TermsAndConditions.tsx`
Same styling with sections covering:
- Acceptance of Terms
- Booking Policy (seat reservations, validity, rules)
- Cancellation & Refund Policy
- User Responsibilities (no sharing seats, library rules)
- Governing Law (India)

### `src/components/home/HomeBanner.tsx`
Auto-sliding banner carousel component:
- Fetches active banners from the `banners` table ordered by `display_order`
- Auto-advances every 4 seconds via `setInterval`
- Left/right arrow buttons for manual control
- Dot indicators (clickable)
- Default gradient branded slide when no banners exist in DB
- Pause on hover / touch

### `src/components/admin/BannerManagement.tsx`
Admin component with:
- Table listing existing banners: thumbnail, title, active toggle, order, delete button
- "Add Banner" form: title, subtitle, image upload to `banners` bucket, link URL, display order
- Image upload flow: `supabase.storage.from('banners').upload(path, file)` → `getPublicUrl(path)`
- Active toggle: `supabase.from('banners').update({ is_active })` 
- Delete: removes DB row + storage file

### `src/pages/admin/BannerManagement.tsx`
Simple wrapper page rendering `<BannerManagement />`.

---

## Step 3 — Files to Update

### `src/App.tsx`
Add new routes:
```
/privacy-policy  → PrivacyPolicy page
/terms           → TermsAndConditions page
/about           → About page (already exists, just verify route)
```
Add admin nested route:
```
banners → BannerManagement page (inside admin layout)
```

### `src/components/admin/AdminSidebar.tsx`
Add "Banners" link to the sidebar under the Settings/Content group.

### `src/components/student/MobileBottomNav.tsx`
Change `label: 'Rooms'` → `label: 'Study Rooms'`.

### `src/pages/Index.tsx`

**Fix #2 — Quick actions grid:**
Change `grid-cols-4` → `grid-cols-2` with horizontal card layout so "My Bookings" text has space:
```tsx
<div className="grid grid-cols-2 gap-2.5">
  <Link>
    <div className="flex items-center gap-2.5 p-3 bg-card rounded-2xl border">
      <Icon /> <span>Label</span>
    </div>
  </Link>
</div>
```

**Fix #3 — Add HomeBanner:**
Insert `<HomeBanner />` component between the greeting header and the booking card in `AuthenticatedHome`, and between the hero and "Why InhaleStays" in `GuestHome`.

**Fix #9 — Auto-swipe "Why InhaleStays":**
Replace the `overflow-x-auto` horizontal scroll with a full-width auto-carousel:
```tsx
const [featureIndex, setFeatureIndex] = useState(0);
useEffect(() => {
  const t = setInterval(() => setFeatureIndex(i => (i + 1) % features.length), 3000);
  return () => clearInterval(t);
}, []);

// Render: single card visible, CSS translateX transition, dot indicators
<div className="relative overflow-hidden rounded-2xl">
  <div style={{ transform: `translateX(-${featureIndex * 100}%)` }}
       className="flex transition-transform duration-500">
    {features.map(f => <div className="min-w-full">...</div>)}
  </div>
  <Dots />
</div>
```
Applied to both `AuthenticatedHome` and `GuestHome`.

### `src/components/profile/ProfileManagement.tsx`

**Fix #6 — My Bookings inside ProfileManagement, above accordions:**
- Move booking fetch logic INTO this component
- Render My Bookings summary card between the avatar header and the Accordion sections

**Fix #7 — Logout button:**
At the bottom of the component (after all accordions), add:
```tsx
import { useAuth } from '@/contexts/AuthContext';
const { logout } = useAuth();

<Button variant="destructive" onClick={logout} className="w-full rounded-2xl mt-2">
  <LogOut className="h-4 w-4 mr-2" /> Logout
</Button>
```

**Fix #8 — Per-section edit/save:**
Replace global `isEditing` with section-level state:
```tsx
const [editingSection, setEditingSection] = useState<string | null>(null);
const [sectionDraft, setSectionDraft] = useState<Partial<ProfileData>>({});

const startEdit = (section: string) => {
  setEditingSection(section);
  setSectionDraft({ ...profile });
};
const saveSection = async () => {
  await userProfileService.updateProfile({ ...profile, ...sectionDraft });
  setProfile(prev => ({ ...prev, ...sectionDraft }));
  setEditingSection(null);
};
const cancelSection = () => setEditingSection(null);
```

Each AccordionItem trigger row gets inline Edit / Save / Cancel buttons. The `field()` helper accepts the section's editing flag. Phone is shown in Account section below Email.

**Legal footer links:**
At the very bottom above the logout button:
```tsx
<div className="flex flex-wrap justify-center gap-x-3 gap-y-1 py-3">
  <Link to="/privacy-policy">Privacy Policy</Link>
  <span>·</span>
  <Link to="/terms">Terms</Link>
  <span>·</span>
  <Link to="/contact">Contact Us</Link>
  <span>·</span>
  <Link to="/about">About</Link>
</div>
```

### `src/pages/Profile.tsx`
Since My Bookings and logout are now inside `ProfileManagement`, Profile.tsx becomes a lean wrapper:
```tsx
const Profile = () => (
  <div className="min-h-screen bg-background">
    <ProfileManagement />
  </div>
);
```

### `src/pages/Hostels.tsx`
Rewrite the UI to match CabinSearch:

```
┌────────────────────────────────────┐
│ Sticky header:                     │
│   "Find Hostels"                   │
│   [🔍 Search input] [Filters ▼]   │
│   Gender chips: All | Male | Female│
├────────────────────────────────────┤
│ City chips scrollable row          │
├────────────────────────────────────┤
│ "N hostels found"                  │
│ [Hostel card — same card format]   │
└────────────────────────────────────┘
```

Filter drawer (Sheet from bottom):
- City text input
- Gender chip selector
- Near Me button (calls existing geolocation logic)
- Reset / Apply buttons

The hostelService still calls the Express backend API — no change to the data layer, just the UI shell.

---

## Files Summary

| File | Action |
|---|---|
| `supabase/migrations/[timestamp]_banners.sql` | CREATE — banners table + RLS + storage bucket |
| `src/pages/PrivacyPolicy.tsx` | CREATE |
| `src/pages/TermsAndConditions.tsx` | CREATE |
| `src/components/home/HomeBanner.tsx` | CREATE |
| `src/components/admin/BannerManagement.tsx` | CREATE |
| `src/pages/admin/BannerManagement.tsx` | CREATE |
| `src/App.tsx` | UPDATE — add 3 public routes + 1 admin route |
| `src/components/admin/AdminSidebar.tsx` | UPDATE — add Banners link |
| `src/components/student/MobileBottomNav.tsx` | UPDATE — "Rooms" → "Study Rooms" |
| `src/pages/Index.tsx` | UPDATE — grid fix, HomeBanner, auto-carousel |
| `src/components/profile/ProfileManagement.tsx` | UPDATE — per-section edit, My Bookings, logout, legal links |
| `src/pages/Profile.tsx` | UPDATE — simplify (My Bookings now inside ProfileManagement) |
| `src/pages/Hostels.tsx` | UPDATE — sticky header + filter drawer UI |

## What Is NOT Changed
- All admin pages (except sidebar + new banner page)
- Vendor pages, auth flows, payment logic
- hostelService.ts (still calls backend API)
- BookSeat, Booking, Confirmation pages
- All other student pages
