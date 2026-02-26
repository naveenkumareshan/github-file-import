

## Show Contact Details in Deposits + Transactions, Remove Sidebar Items

### 1. Key Deposits -- Show Email and Phone Beside Name

**File:** `src/components/admin/DepositManagement.tsx`

- In the table row (line 350), the User column currently only shows `deposit.user?.name`
- Add email and phone below the name using the data already available from the Supabase join (`profiles(name, email, phone)`)
- Layout: Name on first line, email + phone on second line in smaller muted text

### 2. All Transactions -- Show Phone Number

**File:** `src/components/admin/AdminBookingsList.tsx`

- The Customer column (lines 434-456) currently shows name, email, userId, and profile picture
- The `Booking` interface (line 38) does not include a `phone` field in `userId`
- Need to check whether the backend API already returns phone in the userId populated object

**File:** `src/api/adminBookingsService.ts` -- Check if the backend populates phone

Since this uses a MongoDB backend API (`adminBookingsService.getAllBookings`), the phone field depends on what the backend returns. The `userId` is populated from the User model which has a `phone` field. Most likely it's already returned but just not displayed.

**Changes:**
- Add `phone?: string` to the `userId` type in the `Booking` interface
- Display phone below email in the Customer column

### 3. Remove Transfer Seat and Manual Booking from Sidebar

**File:** `src/components/admin/AdminSidebar.tsx`

- Remove the two sub-items at lines 133-145:
  - `Transfer Seat` (`/admin/seat-transfer`)
  - `Manual Booking` (`/admin/manual-bookings`)
- The routes and pages remain intact -- they just won't be in the sidebar navigation anymore

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/admin/DepositManagement.tsx` | Show email + phone below user name in deposits table |
| `src/components/admin/AdminBookingsList.tsx` | Add phone to Booking interface, display phone in Customer column |
| `src/components/admin/AdminSidebar.tsx` | Remove Transfer Seat and Manual Booking sub-items |

