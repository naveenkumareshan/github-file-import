

# Plan: Add Test Mess Data + Integrate Mess Subscriptions into Student Bookings

## What needs to happen

The user wants:
1. A test mess partner record linked to an existing test partner
2. Some meal packages created for it
3. The mess visible on the student marketplace
4. Mess subscriptions (bookings) to appear in the student's "My Bookings" page
5. All navigation links working properly

## Current State

- Mess tables exist: `mess_partners`, `mess_packages`, `mess_subscriptions`, `mess_receipts`, `mess_attendance`
- Student marketplace (`/mess`) and detail page (`/mess/:id`) are built and functional
- Student mess dashboard (`/student/mess`) exists for QR/attendance
- **Problem**: `StudentBookings.tsx` only shows Reading Room + Hostel bookings — mess subscriptions are NOT included
- Test partner exists: `b7223bac-ef5c-48aa-ba49-d530d15f6f8e` (TestPartner)

## Steps

### 1. Insert test data via database
- Insert a `mess_partners` record linked to TestPartner (`b7223bac...`), set `is_active=true`, `is_approved=true`
- Insert 3 `mess_packages` for it:
  - "Breakfast Only" — daily, 1 day, ₹50
  - "Full Day Meals" — monthly, 1 month, ₹3000, all meals
  - "Lunch + Dinner" — weekly, 1 week, ₹500

### 2. Add Mess Subscriptions to Student Bookings page
Modify `src/pages/StudentBookings.tsx`:
- Fetch mess subscriptions via `getMyMessSubscriptions(userId)` 
- Map them into the same `Booking` shape with `bookingType: 'mess'`
- Merge into current/past lists
- Make the card navigate to `/student/mess` when clicked (since there's no individual mess booking detail page)

### 3. Add a "Book Mess" quick-action button
In `StudentBookings.tsx`, add a third button alongside "Book Reading Room" and "Book Hostel" that navigates to `/mess`.

### 4. Update BookingsList to handle mess type
In `src/components/booking/BookingsList.tsx`, ensure mess-type bookings render correctly and link to `/student/mess` instead of the reading room/hostel detail pages.

## Files Modified

| File | Change |
|------|--------|
| Database (insert) | Insert 1 mess_partner + 3 mess_packages |
| `src/pages/StudentBookings.tsx` | Fetch & merge mess subscriptions, add "Book Mess" button |
| `src/components/booking/BookingsList.tsx` | Handle `bookingType: 'mess'` routing |

