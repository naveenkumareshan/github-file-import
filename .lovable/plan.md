

# Profile Photo & Password Reset for All Roles

## What We're Building

1. **Profile photo upload** for partners, employees, and admins — stored in the `profiles` table (`profile_picture` column, already exists) and uploaded to the `profiles` storage bucket (already exists)
2. **User avatar in sidebar header** — show the logged-in user's profile picture next to the InhaleStays logo in the top-left of the admin sidebar
3. **Admin Profile menu item** — admins currently have no "Profile" link in the sidebar; add one pointing to `/admin/profile` (which already routes to VendorProfilePage)
4. **Password reset on admin profile** — already works via VendorProfilePage's "Change Password" card (same component used for both admin and partner routes)

## Technical Changes

### 1. `src/components/admin/AdminSidebar.tsx` — Add avatar + admin Profile link
- In the sidebar header, replace the static logo-only display with a small user avatar (fetched from `profiles.profile_picture`) beside the InhaleStays logo
- Add a "Profile" menu item for admin role (currently only shows for vendors)
- Fetch the profile picture from the `profiles` table on mount

### 2. `src/pages/vendor/VendorProfile.tsx` — Add profile photo upload section
- Add a photo upload card at the top of the profile page
- Upload to `profiles` storage bucket under `{user_id}/avatar.{ext}`
- Update `profiles.profile_picture` with the public URL
- Show current photo with option to change/remove
- Works for all roles (admin, partner, employee) since the same page component is used

### 3. `src/components/admin/AdminSidebar.tsx` — Profile link for admins
- Add `{ title: 'Profile', icon: User, roles: ['admin'], url: '/admin/profile' }` to admin menu items

### Files Modified
- `src/components/admin/AdminSidebar.tsx` — avatar in header + admin profile link
- `src/pages/vendor/VendorProfile.tsx` — profile photo upload card

