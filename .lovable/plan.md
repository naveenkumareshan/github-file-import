

## Fix: Unify Reading Rooms page with shared Marketplace components

### Problem
The `/cabins` route renders `CabinSearch.tsx` which uses a custom header and `CabinSearchResults.tsx` with its own card layout. Hostels, Mess, and Laundry all correctly use the shared `MarketplaceCard` and `MarketplaceHeader` components, but Reading Rooms does not -- causing the visual inconsistency you see.

### Solution
Update `CabinSearch.tsx` and `CabinSearchResults.tsx` to use the shared marketplace components while preserving the advanced filter drawer, pagination, and sponsored listing logic.

### Changes

**1. `src/pages/CabinSearch.tsx`** -- Replace custom header with `MarketplaceHeader`
- Use `MarketplaceHeader` for search bar + category filter chips (All, Standard, Premium, Luxury)
- Keep the "Filters" button as an extra action that opens the existing filter drawer
- Keep all filter drawer logic, pagination, and sponsored listing code intact

**2. `src/components/search/CabinSearchResults.tsx`** -- Replace custom card markup with `MarketplaceCard`
- Replace the inline card JSX with `<MarketplaceCard>` for each cabin
- Map cabin data to MarketplaceCard props (badge = category, tags = amenities, price, rating, location)
- Keep skeleton, empty state, and "Load More" pagination
- Use `MarketplaceSkeleton` for loading state
- Preserve sponsored listing ref/click tracking via `sponsoredTier` and `sponsoredRef` props

### What stays the same
- Advanced filter drawer (location, price range, sort, radius)
- Pagination / "Load More" button
- Sponsored listing tracking
- All data fetching and search logic

