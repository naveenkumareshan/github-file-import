

## Remove Top Header Bar from MobileAppLayout

The entire fixed top header bar (logo + avatar) in `MobileAppLayout` will be removed. The bottom navigation bar stays.

### Change

**File: `src/components/student/MobileAppLayout.tsx`**
- Remove the entire `<header>` element (lines 23-48) containing the logo, brand name, and avatar
- Remove the `pt-14` padding from `<main>` (no longer needed since the fixed header is gone)
- Remove unused imports: `Avatar`, `AvatarFallback`, `inhalestaysLogo`, and the `initials` computation
- Keep `useAuth` only if still needed by other parts (it's not -- remove it too)

The profile/avatar access point already exists in the bottom nav ("Profile" tab), so removing the header doesn't lose any navigation capability.

### Result
- Full-screen content area with only the bottom nav bar
- More vertical space for page content
- Cleaner, more native-app feel

