

## Student Profile Redesign + Complaints System + Support Tickets

### Overview

Redesign the student profile page layout, add a complaints and customer support system across student/admin/partner sides, make booking transactions clickable, and fix the Active/Expired booking tab logic.

---

### 1. Profile Page Restructure -- Link-Style Navigation

**Current**: Profile has accordion sections (Account Info, Personal Info, Academic Info, Security) expanded inline below the header card.

**New**: Replace the accordion with a list of navigation rows inside the profile card. Each row shows an icon, label, and a chevron-right arrow. Tapping a row navigates to a dedicated sub-page (or opens a sheet/dialog) for that section.

**Layout (reference image style):**
```text
+----------------------------------+
| [Avatar]  Name                   |
|           email@example.com      |
+----------------------------------+
| My Bookings              View All>|
| [Booking card]                    |
+----------------------------------+
| > Account Info              >    |
| > Personal Info             >    |
| > Academic Info             >    |
| > Security                  >    |
+----------------------------------+
| Quick Links                      |
| [Complaints]  [Customer Support] |
+----------------------------------+
| [Logout]                         |
+----------------------------------+
```

**Implementation**: Keep ProfileManagement.tsx but replace `<Accordion>` with a list of clickable rows. Each row opens a full-screen sheet (`<Sheet>`) containing the existing form fields for that section. This avoids creating new routes and keeps everything within the profile page.

**Files**: `src/components/profile/ProfileManagement.tsx`

---

### 2. Complaints System (New Feature)

Create a full complaints system where students can report issues related to their active bookings. Partners (cabin owners) and admins can view and act on these complaints.

#### Database

New `complaints` table:
- `id` (uuid, PK)
- `user_id` (uuid, references auth user)
- `cabin_id` (uuid, nullable, references cabins)
- `booking_id` (uuid, nullable, references bookings)
- `subject` (text)
- `description` (text)
- `status` (text: open, in_progress, resolved, closed)
- `priority` (text: low, medium, high)
- `category` (text: cleanliness, noise, facilities, staff, other)
- `response` (text, nullable -- admin/partner reply)
- `responded_by` (uuid, nullable)
- `responded_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

RLS policies:
- Students can INSERT their own complaints and SELECT their own
- Admins can do ALL
- Partners can SELECT complaints for cabins they manage (future -- for now admin-only on partner side)

#### Student Side

New component `src/components/profile/ComplaintsPage.tsx`:
- Form to submit a complaint (select booking, category, subject, description)
- List of past complaints with status badges
- Accessed via Quick Links on profile

New route: `/student/complaints`

#### Admin Side

New component `src/components/admin/ComplaintsManagement.tsx`:
- Table of all complaints with filters (status, priority, category)
- Click to view details, respond, change status
- Message/reply functionality

New route under admin layout: `/admin/complaints`

#### Partner Side

For now, partner complaints will be visible through the admin panel. A dedicated partner view can be added later.

**Files**:
- `src/components/profile/ComplaintsPage.tsx` (new)
- `src/components/admin/ComplaintsManagement.tsx` (new)
- `src/App.tsx` (new routes)
- Database migration for `complaints` table

---

### 3. Customer Support System

Create a support ticket system for general issues (not booking-specific) from InhaleStays platform side.

#### Database

New `support_tickets` table:
- `id` (uuid, PK)
- `user_id` (uuid)
- `subject` (text)
- `description` (text)
- `status` (text: open, in_progress, resolved, closed)
- `category` (text: account, payment, technical, general)
- `admin_response` (text, nullable)
- `responded_by` (uuid, nullable)
- `responded_at` (timestamptz, nullable)
- `created_at`, `updated_at` (timestamptz)

RLS: Same pattern as complaints (students own, admins all).

#### Student Side

New component `src/components/profile/SupportPage.tsx`:
- Form to submit a support ticket
- List of past tickets with status
- Accessed via Quick Links on profile

New route: `/student/support`

#### Admin Side

New component `src/components/admin/SupportTicketsManagement.tsx`:
- Table of all tickets, filters, respond, change status

New route: `/admin/support-tickets`

**Files**:
- `src/components/profile/SupportPage.tsx` (new)
- `src/components/admin/SupportTicketsManagement.tsx` (new)
- `src/App.tsx` (new routes)
- Database migration for `support_tickets` table

---

### 4. Booking Transaction Details (Clickable)

**Current**: Booking cards in the profile's "My Bookings" section are not clickable for transaction details.

**Change**: Make each booking card in the profile page clickable. Tapping navigates to `/student/bookings/{bookingId}/transactions/cabin` which already exists and shows the `BookingTransactionView`.

**Files**: `src/components/profile/ProfileManagement.tsx` -- wrap booking cards with `Link`

---

### 5. Fix Active vs Expired Booking Tabs

**Current issue**: `getBookingHistory()` returns ALL bookings (no date filter), so active bookings appear in both Active and Expired tabs.

**Fix**: In `getBookingHistory()`, add a filter to only return bookings where `end_date < today` OR `payment_status != 'completed'` (cancelled/failed). This ensures completed active bookings only show under Active.

Alternatively, filter client-side in `StudentBookings.tsx`: the `pastBookings` list should exclude bookings that are still active (end_date >= today AND payment_status = completed).

**Files**: `src/api/bookingsService.ts` or `src/pages/StudentBookings.tsx`

---

### Technical Summary

| Change | Files |
|---|---|
| Profile restructure (nav rows + sheets) | `src/components/profile/ProfileManagement.tsx` |
| Complaints system -- student | `src/components/profile/ComplaintsPage.tsx` (new) |
| Complaints system -- admin | `src/components/admin/ComplaintsManagement.tsx` (new) |
| Support tickets -- student | `src/components/profile/SupportPage.tsx` (new) |
| Support tickets -- admin | `src/components/admin/SupportTicketsManagement.tsx` (new) |
| Routes | `src/App.tsx` |
| Clickable booking transactions | `src/components/profile/ProfileManagement.tsx` |
| Fix Active/Expired tabs | `src/api/bookingsService.ts` |
| Database | Migration: `complaints` table, `support_tickets` table with RLS |

