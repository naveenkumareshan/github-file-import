

## Remove Navigation and Footer from All Student Pages

All student/public pages are rendered inside `MobileAppLayout`, which already provides a fixed top header (with logo + avatar) and a fixed bottom navigation bar. However, many child pages still render their own `<Navigation />` component (desktop header) and `<Footer />` (full branded footer), causing duplicate headers and non-app-like layouts.

This plan removes all `<Navigation />` and `<Footer />` usage from pages rendered within the MobileAppLayout shell, making them fit cleanly within the mobile app layout on any phone.

---

### Pages to Update

**1. `src/pages/Cabins.tsx`**
- Remove `<Navigation />` and `<Footer />` from JSX
- Remove `min-h-screen` wrapper (MobileAppLayout handles this)
- Remove unused imports

**2. `src/pages/Booking.tsx`**
- Remove `<Navigation />` from all return paths (loading + main)
- Remove inline footer block (`<footer className="bg-cabin-dark...">`)
- Clean wrapper div

**3. `src/pages/Confirmation.tsx`**
- Remove `<Navigation />` and inline footer
- Remove unused import

**4. `src/pages/HostelConfirmation.tsx`**
- Remove `<Navigation />` and inline footer
- Remove unused import

**5. `src/pages/HostelBooking.tsx`**
- Remove `<Navigation />` and `<Footer />` from all return paths (error state + main)
- Remove unused imports

**6. `src/pages/HostelRooms.tsx`**
- Remove `<Navigation />` from all 3 return paths (loading, error, main)
- Remove unused import

**7. `src/pages/BookSharedRoom.tsx`**
- Remove `<Navigation />` from all 3 return paths
- Remove unused import

**8. `src/pages/BookingConfirmation.tsx`**
- Remove `<Navigation />` and `<Footer />` from all return paths
- Remove unused imports

**9. `src/pages/Laundry.tsx`**
- Remove `<Navigation />` and `<Footer />`
- Remove unused imports

**10. `src/pages/StudentLogin.tsx`**
- Remove unused `Navigation` import (not used in JSX but still imported)

**11. `src/pages/StudentRegister.tsx`**
- Remove unused `Navigation` import

**12. `src/pages/ForgotPassword.tsx`**
- Remove unused `Navigation` import

---

### What stays unchanged
- `MobileAppLayout` (already provides app-compatible header + bottom nav)
- `MobileBottomNav` (unchanged)
- Admin pages (not affected, use their own AdminLayout)
- Pages that already don't have Navigation/Footer (Index, About, CabinSearch, BookSeat, Hostels, Profile, StudentBookings, HostelRoomDetails)

### Result
All student pages will render content only -- no duplicate headers, no heavy footers, fitting cleanly into the app shell with the fixed top header and bottom nav bar, compatible with any phone screen.

