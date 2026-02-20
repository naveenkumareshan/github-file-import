
## What's Already Done vs What Still Needs Fixing

After reading all the current files, here's the exact state:

**Already working:**
- HomeBanner carousel (auto-slides every 4s) — exists and integrated
- BannerManagement admin component — exists with upload
- PrivacyPolicy + TermsAndConditions pages — exist
- Quick actions 2x2 grid — already fixed
- Logout button in ProfileManagement — exists
- Phone shown below email in Account section — already correct

**Still broken — what I will fix:**

### 1. About page link in Profile legal links
Current: legal links only show Privacy Policy · Terms
Fix: Add "About" link → `/about` in the legal links row

### 2. Banner date fields (start date + expiry) — DB migration needed
Current: `banners` table has no `start_date` or `expire_at` columns
Fix: Add `start_date date` and `expire_at date` columns to the `banners` table. Update `HomeBanner.tsx` to filter out expired/not-yet-started banners. Update `BannerManagement.tsx` form to show date pickers.

### 3. Per-section edit/save in ProfileManagement
Current: ONE global `isEditing` boolean — clicking Edit on the header unlocks ALL sections at once, one Save button
Fix: Replace with `editingSection: string | null` state. Each accordion section (Account, Personal, Academic) gets its own pencil icon in the trigger. When you click edit on a section, only that section's fields become editable. That section shows Save + Cancel buttons. Other sections stay locked. Security section (password) is always editable independently.

### 4. Why InhaleStays — auto-carousel instead of scroll
Current: `overflow-x-auto` horizontal scroll row in both `AuthenticatedHome` and `GuestHome`  
Fix: Replace with a `translateX` CSS carousel that auto-advances every 5 seconds with dot indicators. One card visible at a time. Add `featureIndex` state + `useEffect` interval in both components.

### 5. My Bookings position in Profile
Current: My Bookings is rendered in `Profile.tsx` BELOW the `<ProfileManagement />` component
Fix: Move the My Bookings section INTO `ProfileManagement.tsx`, placed between the avatar header card and the accordion sections. Remove it from `Profile.tsx` (simplify Profile.tsx). The bookings fetch logic moves into `ProfileManagement`.

---

## Technical Implementation

### DB Migration — add date columns to banners
```sql
ALTER TABLE public.banners 
  ADD COLUMN start_date date,
  ADD COLUMN expire_at date;
```

### Files to change (5 files + 1 migration):

**`src/components/profile/ProfileManagement.tsx`** — Major rewrite:
- Import `BookMarked, ChevronRight` from lucide
- Import `bookingsService` 
- Add `bookings`, `loadingBookings` state
- Fetch bookings in `useEffect` alongside `loadProfile`
- Replace global `isEditing` / `savedProfile` with:
  ```ts
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState<Partial<ProfileData>>({});
  ```
- Add `startEdit(section)` — copies current profile fields into `sectionDraft`, sets `editingSection`
- Add `cancelEdit()` — clears draft and editingSection
- Add `saveSection()` — merges draft into profile, calls `userProfileService.updateProfile`, clears editingSection
- Update `field()` helper to read from `sectionDraft` when `editingSection === currentSection`, else from `profile`
- Each AccordionTrigger gets a pencil/check/x button row
- Insert My Bookings block between avatar card and Accordion
- Add "About" to legal links

**`src/pages/Profile.tsx`** — Simplify:
- Remove the bookings fetch + My Bookings JSX (it moves into ProfileManagement)
- Just render `<ProfileManagement />` inside the page div

**`src/pages/Index.tsx`** — Fix Why InhaleStays carousel:
- In `AuthenticatedHome`: Add `const [featureIdx, setFeatureIdx] = useState(0)` at component top, add `useEffect` with `setInterval(5000)`. Replace `overflow-x-auto` div with a `relative overflow-hidden rounded-2xl` container + `translateX` flex div + dot indicators.
- In `GuestHome`: Same treatment for the "Why InhaleStays?" section.

**`src/components/admin/BannerManagement.tsx`** — Add date fields:
- Add `start_date: ''` and `expire_at: ''` to the `empty()` form shape
- Add two `<Input type="date">` fields for Start Date and Expiry Date in the form grid
- Pass them in `handleCreate` insert

**`src/components/home/HomeBanner.tsx`** — Filter by dates:
- After fetching banners, filter client-side:
  ```ts
  const today = new Date().toISOString().split('T')[0];
  const filtered = data.filter(b => 
    (!b.start_date || b.start_date <= today) && 
    (!b.expire_at || b.expire_at >= today)
  );
  ```

All 5 files + 1 migration implemented in one pass.
