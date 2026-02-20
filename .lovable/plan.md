
# 9-Point Feature Plan: Pages, UI Fixes, Banner, Profile Redesign

## Summary of All Changes

| # | Request | File(s) Changed |
|---|---|---|
| 1 | Create About, Privacy Policy, Terms & Conditions pages | 3 new pages + App.tsx routes + Profile links |
| 2 | Fix "My Bookings" quick action button alignment | Index.tsx |
| 3 | Image banner on homepage with admin management | New `banners` DB table, new BannerManagement admin component, Index.tsx |
| 4 | Hostel UI same search/filter as Reading Rooms | Hostels.tsx |
| 5 | Fix "Rooms" label → "Reading Rooms" in bottom nav & pages | MobileBottomNav.tsx, CabinSearch.tsx |
| 6 | "My Bookings" section move above Account Info in Profile | Profile.tsx restructure |
| 7 | Logout button at bottom of Profile | Profile.tsx |
| 8 | Per-section edit/save in ProfileManagement (not global edit) | ProfileManagement.tsx |
| 9 | "Why InhaleStays" auto-swipe carousel instead of scroll | Index.tsx |

---

## Change 1 — Legal/Info Pages + Profile Links

### New pages to create:

**`src/pages/PrivacyPolicy.tsx`**
- Sections: Information We Collect, How We Use It, Data Security, Cookies, Contact
- Same mobile-first design as `About.tsx` (gradient hero, Card sections)

**`src/pages/TermsAndConditions.tsx`**
- Sections: Acceptance of Terms, Booking Policy, Cancellation, User Responsibilities, Governing Law
- Same styling

**`src/pages/Contact.tsx`** (may already exist — will check/update)
- Contact form (name, email, message), address, WhatsApp link

### Profile page — links to legal pages:
At the very bottom of `src/pages/Profile.tsx`, add a compact footer row of text links:
```
Privacy Policy · Terms & Conditions · Contact Us · About
```

### App.tsx — add routes:
```tsx
<Route path="/privacy-policy" element={<StudentSuspense><PrivacyPolicy /></StudentSuspense>} />
<Route path="/terms" element={<StudentSuspense><TermsAndConditions /></StudentSuspense>} />
```

---

## Change 2 — Fix "My Bookings" Quick Action Alignment

**File:** `src/pages/Index.tsx`

**Problem:** The 4 quick action tiles use `grid-cols-4` which makes each tile too narrow for the label "My Bookings" — the text overflows or wraps badly.

**Fix:** Change to `grid-cols-2 gap-3` with a horizontal card layout per action, OR change to a `2×2` grid with larger tiles. Going with a **2×2 grid** (2 columns, 2 rows) with slightly taller tiles so labels fit:

```tsx
<div className="grid grid-cols-2 gap-2.5">
  {quickActions.map((a) => (
    <Link key={a.label} to={a.to} className="block">
      <div className="flex items-center gap-2.5 p-3 bg-card rounded-2xl border active:scale-95 transition-transform">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
          <a.icon className="w-4 h-4" />
        </div>
        <span className="text-[12px] font-medium text-foreground leading-tight">{a.label}</span>
      </div>
    </Link>
  ))}
</div>
```

This gives each button enough horizontal space for "My Bookings" text.

---

## Change 3 — Image Banner with Admin Management

### Database migration:
Create a `banners` table:
```sql
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS: public can SELECT active banners, admins can do all
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
```

### Storage bucket:
Create a `banners` storage bucket for image uploads.

### New component: `src/components/home/HomeBanner.tsx`
Auto-sliding banner carousel:
- Fetches active banners from DB ordered by `display_order`
- Auto-advances every 4 seconds using `setInterval`
- Manual dot controls and left/right arrow buttons
- Smooth CSS transition between slides
- If no banners in DB: shows a default branded gradient slide

```tsx
const [currentIndex, setCurrentIndex] = useState(0);
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  }, 4000);
  return () => clearInterval(timer);
}, [banners.length]);
```

### New admin component: `src/components/admin/BannerManagement.tsx`
- Table of existing banners with: image thumbnail, title, active toggle, order, delete
- "Add Banner" form: title, subtitle, upload image (to `banners` storage bucket), link URL, order
- Image upload uses Lovable Cloud storage: `supabase.storage.from('banners').upload(...)`
- Reads back public URL via `supabase.storage.from('banners').getPublicUrl(...)`

### New admin page: `src/pages/admin/BannerManagement.tsx`
Wrapper page rendering `<BannerManagement />`.

### App.tsx — add admin route:
```tsx
<Route path="banners" element={<BannerManagement />} />
```

### AdminSidebar — add "Banners" link:
Add a "Banners" nav item in the admin sidebar under the content/settings section.

### Index.tsx — add banner in both views:
In `GuestHome` (public): show `<HomeBanner />` between the hero section and "Why InhaleStays".
In `AuthenticatedHome`: show `<HomeBanner />` between the booking card and quick actions (or at the very top just below the greeting bar).

---

## Change 4 — Hostel UI = Reading Rooms UI

**File:** `src/pages/Hostels.tsx`

The current hostel page has a basic search bar and city chips but misses the compact, sticky search header with a filter drawer (Sheet) that CabinSearch has.

**Rewrite `Hostels.tsx`** to match `CabinSearch.tsx` structure:

```
┌─────────────────────────────────────┐
│ [sticky header]                     │
│  "Find Hostels"                     │
│  [🔍 Search bar...     ] [Filters ▼]│
│  [Gender chips: Male | Female | Co] │
├─────────────────────────────────────┤
│ Popular city chips (scrollable)     │
├─────────────────────────────────────┤
│ N hostels found                     │
│ [Hostel card]  (same horizontal     │
│ [Hostel card]   card format)        │
└─────────────────────────────────────┘
```

Filter drawer (Sheet bottom) contains:
- City input (text-based since hostelService uses city string param)
- Gender: Male / Female / Co-ed chips
- Near Me button (geolocation)
- Reset / Apply

**Note:** `hostelService` still calls the backend Express API (`localhost:5000`). Since the plan is to only change the UI structure (not the data source for hostels which is MongoDB-backed), the hostel service calls are kept as-is. The Hostels page will show an empty list or error when backend is down — same as now. The UI improvement is purely structural/visual to match the reading rooms layout.

---

## Change 5 — Rename "Rooms" → "Reading Rooms" in Nav & Pages

**Files:**
- `src/components/student/MobileBottomNav.tsx` — change tab label from `'Rooms'` to `'Reading Rooms'` (or `'Study'` if too long for nav). Given 10px text limit, use **"Study Rooms"** (fits in 2 words).
- `src/pages/CabinSearch.tsx` — header already says `"Reading Rooms"` — this is correct. No change needed.
- Check other places where "Rooms" is used alone to mean reading rooms.

Actually, looking at the bottom nav, "Rooms" at 10px is fine but the label says the wrong thing. Change `label: 'Rooms'` to `label: 'Study Rooms'`. The icon `BookOpen` already communicates "reading".

Also in the guest home page CTA button: "Book Reading Room" — already correct.

---

## Change 6 — Move "My Bookings" Above Account Info in Profile

**File:** `src/pages/Profile.tsx`

Currently the render order is:
1. `<ProfileManagement />` (which contains avatar header + 4 accordion sections)
2. My Bookings summary

The request is: My Bookings should appear **below the student name/details but before Account Info**.

Since `ProfileManagement` renders the avatar+name header AND the accordion sections as one component, the cleanest approach is to:
- Move the **My Bookings summary** out of `Profile.tsx` and into `ProfileManagement.tsx` itself, rendered between the avatar header card and the accordion
- Or, split Profile.tsx so the avatar header is separate

**Implementation:** Lift the bookings data fetch into `ProfileManagement.tsx` and render "My Bookings" inline between the avatar header card and the first accordion section. Profile.tsx becomes just `<ProfileManagement />`.

**New render order inside `ProfileManagement.tsx`:**
```
1. Avatar card (name, email, initials)
2. My Bookings mini section (2 recent + "View All")
3. Accordion: Account Info
4. Accordion: Personal Info
5. Accordion: Academic Info
6. Accordion: Security
7. Legal links footer
8. Logout button
```

---

## Change 7 — Logout Button at Bottom of Profile

**File:** `src/components/profile/ProfileManagement.tsx`

Add a logout button at the very end of the component (after all accordions). Uses `useAuth()` context to call `signOut()` or `logout()`.

```tsx
import { useAuth } from '@/contexts/AuthContext';
const { logout } = useAuth(); // or signOut

// At the bottom:
<Button
  variant="destructive"
  onClick={logout}
  className="w-full h-10 rounded-2xl text-[13px] mt-2"
>
  <LogOut className="h-4 w-4 mr-2" />
  Logout
</Button>
```

Need to check what the auth context exposes — will read `AuthContext.tsx`.

---

## Change 8 — Per-Section Edit/Save (Not Global Edit)

**File:** `src/components/profile/ProfileManagement.tsx`

**Current:** One global `isEditing` boolean → Edit button → all 4 sections editable at once → single Save.

**New:** Each accordion section has its own "Edit / Save / Cancel" trio. The profile state is still one object, but each section has independent editing state.

**Implementation:**
```tsx
// Track which section is being edited
const [editingSection, setEditingSection] = useState<string | null>(null);
// Temp state for the section being edited (rollback on cancel)
const [sectionDraft, setSectionDraft] = useState<Partial<ProfileData>>({});

const startEdit = (section: string) => {
  setEditingSection(section);
  setSectionDraft({ ...profile }); // copy all fields for rollback
};

const saveSection = async (section: string) => {
  setIsLoading(true);
  try {
    await userProfileService.updateProfile({ ...profile, ...sectionDraft });
    setProfile(prev => ({ ...prev, ...sectionDraft }));
    setSavedProfile(prev => ({ ...prev, ...sectionDraft }));
    setEditingSection(null);
    toast({ title: 'Saved' });
  } finally { setIsLoading(false); }
};

const cancelSection = () => {
  setSectionDraft({});
  setEditingSection(null);
};
```

Each `AccordionItem` header shows a small `Pencil` icon button (only when that section is NOT being edited). When editing, shows `Check` and `X` buttons inline in the header area.

The `field()` helper takes an additional `isEditing` param (the section's edit state):
```tsx
const field = (
  id: keyof ProfileData,
  label: string,
  sectionEditing: boolean,
  type = 'text',
  placeholder = ''
) => ( ... disabled={!sectionEditing} ... )
```

**Section-specific fields:**
- **Account section**: name, email, phone, alternate_phone, gender
  - Phone shown explicitly below email (request #8 specifically)
- **Personal section**: date_of_birth, address, city, state, pincode
- **Academic section**: course_preparing_for, course_studying, college_studied, parent_mobile_number, bio
- **Security section**: Always-editable password change (no edit toggle needed here)

---

## Change 9 — Auto-Swipe "Why InhaleStays" Carousel

**File:** `src/pages/Index.tsx` — both `AuthenticatedHome` and `GuestHome`

**Current:** Horizontally scrollable row of cards (overflow-x-auto).

**New:** Auto-advancing carousel — one card visible at a time, transitions every 3 seconds, with dot indicators.

```tsx
const features = [
  { icon: BookOpen, title: 'Premium Spaces', desc: '...', color: '...' },
  { icon: Shield, title: 'Safe & Secure', desc: '...', color: '...' },
  { icon: Clock, title: 'Open 24/7', desc: '...', color: '...' },
  { icon: Wifi, title: 'High-Speed WiFi', desc: '...', color: '...' },
  { icon: Coffee, title: 'Amenities', desc: '...', color: '...' },
];

const [featureIndex, setFeatureIndex] = useState(0);
useEffect(() => {
  const t = setInterval(() => setFeatureIndex(i => (i + 1) % features.length), 3000);
  return () => clearInterval(t);
}, []);
```

**Visual layout** — card fills full width, animates with CSS opacity/translateX fade:
```tsx
<div className="relative overflow-hidden rounded-2xl">
  <div
    className="flex transition-transform duration-500 ease-in-out"
    style={{ transform: `translateX(-${featureIndex * 100}%)` }}
  >
    {features.map(f => (
      <div key={f.title} className="min-w-full ...">...</div>
    ))}
  </div>
  {/* Dot indicators */}
  <div className="flex justify-center gap-1.5 mt-2">
    {features.map((_, i) => (
      <button
        key={i}
        onClick={() => setFeatureIndex(i)}
        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === featureIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      />
    ))}
  </div>
</div>
```

This applies to both the guest home and authenticated home versions.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/pages/PrivacyPolicy.tsx` | CREATE |
| `src/pages/TermsAndConditions.tsx` | CREATE |
| `src/components/home/HomeBanner.tsx` | CREATE |
| `src/components/admin/BannerManagement.tsx` | CREATE |
| `src/pages/admin/BannerManagement.tsx` | CREATE |
| DB migration | CREATE `banners` table + storage bucket |
| `src/pages/Index.tsx` | UPDATE — fix alignment, add banner, auto-carousel |
| `src/pages/Profile.tsx` | UPDATE — reorder, logout, legal links |
| `src/components/profile/ProfileManagement.tsx` | UPDATE — per-section edit, My Bookings inside, logout |
| `src/pages/Hostels.tsx` | UPDATE — sticky header + filter drawer UI |
| `src/components/student/MobileBottomNav.tsx` | UPDATE — rename label |
| `src/App.tsx` | UPDATE — add new routes + banner admin route |
| `src/components/admin/AdminSidebar.tsx` | UPDATE — add Banners link |

## What Is NOT Changed
- Admin pages (except sidebar + new banner page)
- Vendor pages
- Auth flows
- BookSeat, Booking, Confirmation pages
- hostelService.ts (still calls backend API)
- All other student pages
