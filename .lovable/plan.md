

## Hostel Booking Marketplace -- Full Build Plan

This plan migrates the entire hostel module from the legacy Express/MongoDB backend to the cloud database and builds a complete OYO/Airbnb-style marketplace with admin, partner, and student panels.

---

### Phase 1: Database Schema (Cloud Migration)

Create the following tables mirroring the reading room pattern:

**Table: `hostels`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| serial_number | text | Auto-generated (INSH prefix) |
| name | text | Required |
| description | text | |
| location | text | Full address |
| locality | text | Area/neighborhood |
| state_id | uuid FK -> states | |
| city_id | uuid FK -> cities | |
| area_id | uuid FK -> areas | |
| gender | text | Male / Female / Co-ed |
| stay_type | text | Short-term / Long-term / Both |
| logo_image | text | Storage URL |
| images | text[] | Gallery |
| amenities | text[] | |
| contact_email | text | |
| contact_phone | text | |
| coordinates_lat | numeric | |
| coordinates_lng | numeric | |
| is_active | boolean | Default true |
| is_approved | boolean | Default false (admin approval) |
| created_by | uuid | Partner who created it |
| vendor_id | uuid | Partner assignment |
| average_rating | numeric | Default 0 |
| review_count | integer | Default 0 |
| commission_percentage | numeric | Default 10 (admin-set) |
| security_deposit | numeric | Default 0 |
| advance_booking_enabled | boolean | Default false |
| advance_percentage | numeric | Default 50 |
| advance_flat_amount | numeric | |
| advance_use_flat | boolean | Default false |
| refund_policy | text | |
| cancellation_window_hours | integer | Default 24 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Table: `hostel_rooms`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| hostel_id | uuid FK -> hostels | |
| room_number | text | |
| floor | integer | Default 1 |
| category | text | standard / premium / luxury |
| description | text | |
| image_url | text | |
| images | text[] | |
| amenities | text[] | |
| is_active | boolean | Default true |
| created_at | timestamptz | |

**Table: `hostel_sharing_options`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| room_id | uuid FK -> hostel_rooms | |
| type | text | e.g., "Single", "Double", "Triple", "4-Sharing" |
| capacity | integer | Persons per unit |
| total_beds | integer | |
| price_daily | numeric | Default 0 |
| price_monthly | numeric | Required |
| is_active | boolean | Default true |
| created_at | timestamptz | |

**Table: `hostel_beds`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| room_id | uuid FK -> hostel_rooms | |
| sharing_option_id | uuid FK -> hostel_sharing_options | |
| bed_number | integer | |
| is_available | boolean | Default true |
| is_blocked | boolean | Default false |
| block_reason | text | |
| created_at | timestamptz | |

**Table: `hostel_bookings`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| serial_number | text | Auto-generated (HBKNG prefix) |
| user_id | uuid | Booker |
| hostel_id | uuid FK -> hostels | |
| room_id | uuid FK -> hostel_rooms | |
| bed_id | uuid FK -> hostel_beds | |
| sharing_option_id | uuid FK -> hostel_sharing_options | |
| start_date | date | |
| end_date | date | |
| booking_duration | text | daily / weekly / monthly |
| duration_count | integer | |
| total_price | numeric | |
| advance_amount | numeric | Default 0 |
| remaining_amount | numeric | Default 0 |
| security_deposit | numeric | Default 0 |
| payment_status | text | pending / advance_paid / completed / failed |
| status | text | pending / confirmed / cancelled / expired |
| payment_method | text | |
| razorpay_order_id | text | |
| razorpay_payment_id | text | |
| razorpay_signature | text | |
| transaction_id | text | |
| cancellation_reason | text | |
| cancelled_at | timestamptz | |
| collected_by | uuid | |
| collected_by_name | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Table: `hostel_receipts`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| serial_number | text | Auto-generated (HRCPT prefix) |
| booking_id | uuid FK -> hostel_bookings | |
| user_id | uuid | |
| hostel_id | uuid FK -> hostels | |
| amount | numeric | |
| payment_method | text | |
| transaction_id | text | |
| receipt_type | text | booking_payment / due_collection / deposit_refund |
| collected_by | uuid | |
| collected_by_name | text | |
| notes | text | |
| created_at | timestamptz | |

**RLS Policies** (applied to all tables):
- Admin: full access via `has_role(auth.uid(), 'admin')`
- Vendor/Partner: manage own hostels via `created_by = auth.uid()`
- Students: view active hostels/rooms, manage own bookings
- Public: view active hostels and rooms (SELECT only)

**Serial number triggers**: `set_serial_hostel_bookings` (HBKNG) and `set_serial_hostel_receipts` (HRCPT)

**Storage bucket**: `hostel-images` (public) for hostel and room photos

---

### Phase 2: Service Layer (API Migration)

Replace all Express/MongoDB `axios` calls with direct database SDK queries:

**`src/api/hostelService.ts`** -- Complete rewrite:
- `getAllHostels(filters)` -- query `hostels` with joins to states/cities/areas, filter by gender, city, is_active, is_approved
- `getHostelById(id)` -- fetch hostel with rooms, sharing options, and bed counts
- `createHostel(data)` / `updateHostel(id, data)` / `deleteHostel(id)` -- CRUD operations
- `getUserHostels()` -- filter by `created_by = auth.uid()`
- `getNearbyHostels(lat, lng, radius)` -- query by coordinate range
- `uploadLogo(hostelId, file)` -- upload to `hostel-images` bucket

**`src/api/hostelRoomService.ts`** -- Rewrite:
- `getHostelRooms(hostelId)` -- with sharing options and bed availability counts
- `createRoom(hostelId, data)` -- insert room + sharing options + beds
- `updateRoom(roomId, data)` / `deleteRoom(roomId)`
- `getRoomStats(hostelId)` -- occupancy stats

**`src/api/hostelBookingService.ts`** -- New file:
- `createBooking(data)` -- insert booking, update bed availability
- `getUserBookings()` -- student's own bookings
- `getAllBookings(filters)` -- admin/partner view with pagination
- `getBookingById(id)` -- with all joins
- `cancelBooking(id, reason)` -- update status, release bed
- `getBookingsByRoom(roomId)` -- for occupancy view

---

### Phase 3: Super Admin Panel

Add hostel-specific admin features to the existing admin layout:

1. **Hostel Approval Page** (`/admin/hostel-approvals`)
   - List pending hostels with partner info
   - Approve / Reject with notes
   - Set commission percentage per hostel

2. **Hostel Analytics on Dashboard**
   - Add hostel stats cards: Total Hostels, Active Bookings, Revenue, Pending Approvals
   - Reuse `DashboardStatistics` pattern with hostel-specific queries

3. **Commission Management**
   - Inline edit commission % per hostel in the hostel list
   - Default commission setting in admin settings

4. **Refund & Dispute Handling**
   - View cancelled bookings with refund status
   - Process refund actions

5. **Gender Category Management**
   - Already exists in HostelForm -- admin can modify gender on any hostel

**Sidebar updates**: Add "Hostel Approvals" under Hostels section. Remove `VITE_HOSTEL_MODULE` env check so the section is always visible.

---

### Phase 4: Partner (Hostel Owner) Panel

Partners already have access to the admin layout with role-based filtering. Add:

1. **My Hostels Management** (reuse existing `HostelManagement.tsx` but rewired to cloud database)
   - Create/Edit hostel with the HostelForm (already has gender, amenities, images, map)
   - Upload photos to `hostel-images` bucket
   - Set pricing, security deposit, advance payment config

2. **Room & Bed Management** (`/admin/hostels/:hostelId/rooms`)
   - Add rooms with sharing options (Single/Double/Triple/4-Sharing)
   - Set prices per sharing type (daily + monthly)
   - View bed availability per room

3. **Booking Calendar View**
   - Grid view: rooms as rows, dates as columns, colored by occupancy
   - Reuse `BookingCalendarDashboard` pattern

4. **Partner Booking Actions**
   - Manual booking (partner books on behalf of walk-in student)
   - Approve/reject booking requests (if enabled)
   - View earnings with commission deducted

5. **Occupancy Dashboard**
   - Total beds, occupied, available, occupancy %
   - Revenue this month, pending payments

---

### Phase 5: Student/User App

Build mobile-first hostel discovery and booking flow:

1. **Hostel Search** (`/hostels` -- rewrite existing)
   - City-based search with state/city/area hierarchy from cloud DB
   - Gender filter pills (Boys / Girls / Co-ed)
   - Price range filter (via bottom sheet)
   - AC / Non-AC filter
   - Near Me (geolocation)
   - Horizontal card layout matching reading room style

2. **Hostel Detail Page** (`/hostels/:id` -- rewrite existing `HostelRoomDetails`)
   - Auto-sliding image carousel (reuse `CabinImageSlider` with `autoPlay`)
   - Hostel name, address, rating, amenities below images
   - Room cards with sharing options and pricing
   - Map location
   - Reviews section
   - "Book Now" triggers room/bed selection

3. **Booking Flow** (`/hostel-booking/:hostelId/:roomId` -- rewrite existing)
   - Step 1: Select sharing type -> see available beds
   - Step 2: Select duration (Daily/Weekly/Monthly pills, reuse reading room pattern)
   - Step 3: Date selection with auto end-date calculation
   - Step 4: Price summary with advance payment breakdown
   - Step 5: Razorpay payment (reuse existing edge functions)
   - Confirmation page with booking details and invoice

4. **My Hostel Bookings** (add to student bookings list)
   - Tab or filter for "Hostel" bookings in existing `/student/bookings`
   - Booking detail view with receipt history
   - Cancel booking option (within cancellation window)

---

### Phase 6: Advance Payment Module

Reuse reading room advance booking logic:

- Hostel-level config: `advance_booking_enabled`, `advance_percentage`, `advance_flat_amount`, `advance_use_flat`
- Booking flow: calculate advance amount, show breakdown
- Payment creates booking with `payment_status: 'advance_paid'`
- Remaining amount tracked in booking record
- Partner can collect remaining via due management
- Generate hostel receipt for each payment

---

### Phase 7: Gender Filter & Restriction Logic

- Hostels tagged as Male/Female/Co-ed (already in schema)
- Student profile has `gender` field (already exists)
- On booking: if hostel is "Male" and student gender is "Female" -> block with message
- Co-ed allows all genders
- Admin can change hostel gender category anytime
- Filter pills on search page already exist -- just need to wire to cloud DB queries

---

### Files Changed Summary

| Area | Files | Action |
|------|-------|--------|
| Database | Migration SQL | Create 6 tables + RLS + triggers + storage bucket |
| Services | `hostelService.ts`, `hostelRoomService.ts`, new `hostelBookingService.ts` | Rewrite from axios to Supabase SDK |
| Admin | `AdminSidebar.tsx`, new `HostelApprovals.tsx` | Add approvals, remove env check |
| Partner | `HostelManagement.tsx`, `HostelForm.tsx`, `AddRoomWithSharingForm.tsx` | Rewire to cloud DB |
| Student | `Hostels.tsx`, `HostelRoomDetails.tsx`, `HostelBooking.tsx`, `HostelRooms.tsx` | Rewrite with cloud DB + mobile-first UI |
| Booking | `HostelBooking.tsx`, `HostelConfirmation.tsx`, `StudentBookings.tsx` | Full advance payment + Razorpay |
| Routes | `App.tsx` | Add hostel approval route, clean up |
| Types | `types.ts` | Add hostel interfaces |

---

### Implementation Order

1. Database migration (all tables, RLS, triggers, storage)
2. Service layer rewrite (hostelService, hostelRoomService, hostelBookingService)
3. Admin hostel management (rewire existing pages to cloud DB)
4. Partner panel features (room/bed management, booking view)
5. Student search and listing (cloud DB queries, filters)
6. Student booking flow (duration, advance payment, Razorpay)
7. Hostel approvals and commission management
8. Gender restriction enforcement
9. Receipts and due management for hostels

This is a large implementation. Each step builds on the previous one, and the reading room patterns (seat -> bed, cabin -> hostel, booking logic, advance payments, receipts) are reused throughout.

