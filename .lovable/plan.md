

## Controlled Review System for Reading Rooms

### Overview
Migrate the review system from the legacy backend to the database and implement a controlled review workflow: only students with completed bookings can review, one review per booking, reviews start as "pending", and only approved reviews are publicly visible and counted in ratings.

### Database Changes

**New table: `reviews`**
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL) -- references auth.users
- `booking_id` (uuid, NOT NULL, UNIQUE) -- ensures one review per booking
- `cabin_id` (uuid, NOT NULL) -- the reading room being reviewed
- `rating` (integer, NOT NULL) -- 1 to 5
- `title` (text)
- `comment` (text, NOT NULL)
- `status` (text, NOT NULL, default 'pending') -- pending, approved, rejected
- `created_at`, `updated_at` (timestamps)

**RLS policies:**
- Students can INSERT reviews for their own completed bookings
- Students can SELECT their own reviews
- Anyone can SELECT approved reviews
- Admins can SELECT/UPDATE/DELETE all reviews

**Database function: `get_cabin_rating_stats(cabin_uuid)`**
A security-definer function that returns `{ average_rating, review_count }` for approved reviews of a given cabin. This avoids needing a separate table or materialized view.

### Frontend Changes

**1. Review Service (`src/api/reviewsService.ts`)**
Rewrite to use Supabase client instead of axios/backend API:
- `createReview(booking_id, cabin_id, rating, title, comment)`
- `getApprovedReviews(cabin_id)` -- public reviews
- `getUserReviewForBooking(booking_id)` -- check if review exists
- `getAdminReviews(filters)` -- for admin panel
- `updateReviewStatus(review_id, status)` -- approve/reject
- `deleteReview(review_id)`
- `getCabinRatingStats(cabin_id)` -- calls the DB function

**2. Student Dashboard (`src/pages/StudentDashboard.tsx`)**
For each completed booking (`payment_status === 'completed'`), show a "Review Reading Room" button. Before showing, check if a review already exists for that booking. If yes, show "Review Submitted" badge instead.

**3. Review Form (`src/components/reviews/ReviewForm.tsx`)**
Update to accept `bookingId` as a prop, submit to Supabase, and show the review was submitted with pending status message.

**4. Reviews Manager (`src/components/reviews/ReviewsManager.tsx`)**
Update to fetch only approved reviews from Supabase for public display. Remove the old backend API calls.

**5. Reviews List (`src/components/reviews/ReviewsList.tsx`)**
Minor updates to match new data shape from Supabase (field naming differences).

**6. Admin Review Management (`src/pages/admin/ReviewsManagement.tsx`)**
Update to use Supabase queries. Add "Reject" button alongside existing "Approve" button. Filter by status (pending/approved/rejected).

**7. Reading Room Card Rating Badge (`src/components/CabinCard.tsx`)**
Add a badge in the top-left corner:
- If approved reviews exist: show star icon with average rating and count (e.g., "4.5 (23)")
- If no approved reviews: show "New" badge
- Fetch rating stats when cabins are loaded (via the DB function or a joined query)

**8. Cabin Details (`src/components/CabinDetails.tsx`)**
Update rating display to use the new Supabase-based rating stats.

**9. Cabins listing pages (`src/pages/Cabins.tsx`, search results)**
Enrich cabin data with rating stats when displaying cards.

### Technical Details

- The `booking_id` UNIQUE constraint on `reviews` enforces one review per booking at the database level
- A validation trigger ensures the referenced booking belongs to the reviewing user and has `payment_status = 'completed'`
- The `get_cabin_rating_stats` function filters only `status = 'approved'` reviews, ensuring pending/rejected reviews are excluded from calculations
- RLS policies ensure students can only create reviews for their own bookings

### Files to Create
- None (all changes in existing files + DB migration)

### Files to Modify
- `src/api/reviewsService.ts` -- rewrite for Supabase
- `src/pages/StudentDashboard.tsx` -- add review button on completed bookings
- `src/components/reviews/ReviewForm.tsx` -- accept bookingId, use Supabase
- `src/components/reviews/ReviewsManager.tsx` -- use Supabase queries
- `src/components/reviews/ReviewsList.tsx` -- adapt to new data shape
- `src/pages/admin/ReviewsManagement.tsx` -- add reject, use Supabase
- `src/components/CabinCard.tsx` -- add rating/New badge
- `src/components/CabinDetails.tsx` -- update rating source
- `src/pages/Cabins.tsx` -- fetch rating stats for cards

