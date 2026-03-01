

# Add Search Bar Back to Hostels Page

## Problem

When unifying the Hostel filters to match Study Rooms, the search bar was mistakenly removed. You want the search functionality to remain -- only the filter pill styling needed to match the Study Rooms page.

## Change

**File**: `src/pages/Hostels.tsx`

1. Add a `searchQuery` state variable
2. Add a search input with a Search icon in the sticky header, placed between the title and the gender filter pills
3. Update `filteredHostels` to also filter by search query (matching hostel name, area, or city)

The header layout will be:
- Title: "Hostels"
- Search input with search icon (compact, matching the app's mobile-first style)
- Gender filter pills row (All, Male, Female, Co-ed) -- unchanged from current

The search will do client-side filtering on hostel name, area name, and city name.

