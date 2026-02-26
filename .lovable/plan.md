

## Fix Rating and "New" Badges on the Active Cabins Listing

### Problem
The `/cabins` route renders `CabinSearch` (not `Cabins`), and the `CabinSearchResults` component used there:
1. Does not fetch rating stats from the database
2. Does not display a "New" badge for rooms without approved reviews
3. Only shows a star rating inline if `averageRating > 0`, but this value is never populated

The `CabinCard` component (which has the correct badge logic) is not used on any active route.

### Changes

**1. `src/pages/CabinSearch.tsx`**
- Import `reviewsService`
- After fetching cabins, call `reviewsService.getCabinRatingStatsBatch()` for all cabin IDs
- Merge `averageRating` and `reviewCount` into each cabin result before setting state

**2. `src/components/search/CabinSearchResults.tsx`**
- Add `reviewCount` to the `CabinResult` interface
- Replace the inline rating display with a badge approach matching the CabinCard design:
  - If `reviewCount > 0`: show a white badge with star icon, rating, and count (e.g., "4.5 (23)")
  - If no approved reviews: show a green "New" badge
- Position these badges on the image thumbnail (top-left corner, overlaying the category badge or beside it)

### Technical Details

In `CabinSearch.tsx`, after the initial load and search results come back:
```typescript
import { reviewsService } from '@/api/reviewsService';

// After setting search results, enrich with ratings
const cabinIds = newResults.map(c => c.id || c._id).filter(Boolean);
if (cabinIds.length > 0) {
  const stats = await reviewsService.getCabinRatingStatsBatch(cabinIds);
  newResults.forEach(c => {
    const id = c.id || c._id;
    if (id && stats[id]) {
      c.averageRating = stats[id].average_rating;
      c.reviewCount = stats[id].review_count;
    }
  });
}
```

In `CabinSearchResults.tsx`, update the image section to show the badge:
- "New" badge (green) when `reviewCount` is 0 or undefined
- Rating badge (white with star) when `reviewCount > 0`

