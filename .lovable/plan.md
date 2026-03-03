

# Performance Optimization Audit and Cleanup

## 1. Dead Code and Unused Files to Remove

### Completely Unused Components (zero imports elsewhere)
| File | Reason |
|------|--------|
| `src/components/ImageGallery.tsx` | Not imported anywhere |
| `src/components/CabinCard.tsx` | Not imported anywhere |
| `src/components/LaundryComplaint.tsx` | Not imported anywhere |
| `src/components/LaundryLocationModal.tsx` | Not imported anywhere |
| `src/components/LaundryMapLocation.tsx` | Not imported anywhere |
| `src/components/LaundryPriceList.tsx` | Not imported anywhere |
| `src/services/paymentService.ts` | Not imported anywhere (dead class) |
| `src/services/emailService.ts` | Not imported anywhere (dead class, calls non-existent `/api/emails/send`) |

### Legacy/Dead Data Files
| File | Reason |
|------|--------|
| `src/data/bookingData.ts` | Legacy file with localStorage-based seat management from pre-Supabase era. Used only by the old `Booking.tsx` flow and its sub-components |
| `src/utils/roomSeatUtils.ts` | Hardcoded 100-seat demo layout with random prices. Only used by `RoomSeatMap.tsx` which itself is never used as a top-level import |

### Old Booking Flow (Legacy, replaced by BookSeat + SeatBookingForm)
These files form a chain only used by `src/pages/Booking.tsx` (the old booking page). The new flow uses `BookSeat.tsx` -> `SeatBookingForm`. These can be flagged for removal but need confirmation since `Booking.tsx` is still routed:
| File | Notes |
|------|-------|
| `src/components/BookingForm.tsx` | Only used by old Booking.tsx |
| `src/components/CustomerForm.tsx` | Only used by BookingForm.tsx |
| `src/components/PricingSummary.tsx` | Only used by BookingForm.tsx |
| `src/components/BookingSummary.tsx` | Only used by old Booking.tsx |
| `src/components/RoomSeatMap.tsx` | Not imported by any page |
| `src/components/RoomSeatMapView.tsx` | Only used by RoomSeatMap |
| `src/components/EditSeatView.tsx` | Only used by RoomSeatMap |
| `src/components/RoomSeatButton.tsx` | Used by RoomSeatMap chain + SeatSelectionMap |
| `src/components/RoomSeatLegend.tsx` | Only used by RoomSeatMapView |
| `src/components/SelectedSeatInfo.tsx` | Only used by RoomSeatMapView |

### Entire `backend/` Directory
The `backend/` folder contains Express.js/Mongoose code (Node.js server). This is NOT used by the Vite frontend -- all data access now goes through Supabase directly via the `src/api/*` services. This entire directory is dead weight in the bundle (though Vite likely tree-shakes it since nothing imports from it). It can safely be removed.

### Old Axios-Based API Services
25 service files in `src/api/` still import from `axiosConfig.ts` (which points to `http://localhost:5000/api`). These call a non-existent Express backend. They should be audited individually -- some may already be superseded by Supabase-based equivalents, while others may still be in active use via UI components. Key candidates for removal or migration:
- `src/api/roomRestrictionService.ts` (axios)
- `src/api/roomSharingService.ts` (axios)
- `src/api/hostelManagerService.ts` (axios)
- `src/api/hostelBedService.ts` (axios -- but hostel bed operations exist in Supabase services too)
- `src/api/vendorRegistrationService.ts` (axios)
- `src/api/adminManualBookingService.ts` (axios)
- `src/api/bulkBookingService.ts` (axios)
- `src/api/bookingManagementService.ts` (axios)
- `src/api/laundryService.ts` (axios -- cloud version exists as `laundryCloudService.ts`)
- `src/api/adminLaundryService.ts` (axios)
- `src/api/reportsExportService.ts` (axios)
- `src/api/transactionReportsService.ts` (axios)
- `src/api/jobProcessingService.ts` (axios)
- `src/api/emailTemplatesService.ts` (axios)
- `src/api/errorLogsService.ts` (axios)
- `src/api/notificationService.ts` (axios)
- `src/api/adminPayoutService.ts` (axios)
- `src/api/vendorService.ts` (axios)
- `src/api/adminVendorService.ts` (axios)
- `src/api/adminVendorDocumentService.ts` (axios)
- `src/api/vendorDocumentService.ts` (axios)
- `src/api/userSessionService.ts` (axios)
- `src/api/passwordResetService.ts` (axios)
- `src/api/settingsService.ts` (axios)
- `src/api/authService.ts` (axios -- auth now handled by Supabase Auth)

**This is a large migration task.** For this phase, we will focus on removing clearly dead files and optimizing what exists. The axios service migration should be a separate, careful effort.

## 2. Non-Lazy Imports in App.tsx (Bundle Size Impact)

These are eagerly loaded on every page visit, even if the user never visits those routes:

| Import | Fix |
|--------|-----|
| `HostelDetails` (HostelRoomDetails) | Convert to `lazy()` |
| `HostelRooms` | Convert to `lazy()` |
| `HostelRoomView` | Convert to `lazy()` |
| `BookSharedRoom` | Convert to `lazy()` |
| `HostelBooking` | Convert to `lazy()` |
| `LaundryAgentPage` | Convert to `lazy()` |
| `PageNotFound` (NotFound) | Convert to `lazy()` |
| `ScrollToTop` | Keep eager (lightweight) |

## 3. Heavy Dependencies to Optimize

| Package | Size | Current Usage | Optimization |
|---------|------|---------------|--------------|
| `firebase` | ~200KB+ | Only used by `FirebaseNotificationSetup.tsx` (unconfigured, env vars empty) | Remove entirely -- Firebase is not configured |
| `maplibre-gl` | ~200KB+ | Used by 2 components (MapPicker, CabinMapView) | Already lazy-loaded via admin routes -- OK |
| `exceljs` | ~150KB | Used by 1 component (StudentExcelImport) | Already lazy-loaded -- OK |
| `pdfkit` | ~100KB+ | Not imported anywhere in src | Remove from dependencies |
| `moment-timezone` | ~200KB | Not imported anywhere in src | Remove from dependencies |
| `@capacitor/*` (4 packages) | ~50KB | Only `splashScreen.ts` uses core + splash-screen | Keep if mobile app planned, otherwise remove |
| `axios` | ~30KB | Used by 25 legacy services | Keep for now until axios services migrated |

## 4. Console Log Cleanup

**1,907 console statements across 164 files.** Plan:
- Remove all `console.log()` calls (debugging leftovers) -- approximately 400+ instances
- Keep `console.error()` in catch blocks (useful for production debugging)
- Remove `console.warn()` that are just informational

## 5. Performance Optimizations

### 5a. React Query Configuration
Add sensible defaults to `QueryClient`:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000,   // 10 min  
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 5b. Seat Map Rendering (High-Volume)
The `DateBasedSeatMap.tsx` and `SeatMap.tsx` render potentially 100+ seat buttons. Optimizations:
- Memoize individual seat buttons with `React.memo`
- Use `useCallback` for click handlers passed to seats
- Virtualize if seat count exceeds ~200

### 5c. Financial Dashboards (Dues, Receipts, Settlements)
- Ensure server-side pagination (most admin list pages load ALL records)
- Add `limit` and `offset` to Supabase queries in admin services
- Add pagination controls to heavy tables (AdminBookings, DueManagement, Receipts)

### 5d. Image Optimization
- Add `loading="lazy"` to all `<img>` tags in list views (cabin cards, hostel cards)
- Use Supabase image transforms for thumbnails where possible

## 6. Implementation Priority (Phases)

### Phase 1 -- Safe Removals (No risk)
1. Delete unused component files (ImageGallery, CabinCard, LaundryComplaint, LaundryLocationModal, LaundryMapLocation, LaundryPriceList)
2. Delete dead services (paymentService.ts, emailService.ts)
3. Remove unused npm packages (pdfkit, moment-timezone, firebase, @types/mapbox-gl)
4. Convert non-lazy App.tsx imports to lazy()

### Phase 2 -- Console Cleanup
5. Remove ~400+ `console.log()` statements across all files
6. Keep `console.error()` in catch blocks

### Phase 3 -- Performance Gains
7. Add React Query staleTime/gcTime defaults
8. Memoize seat map rendering components
9. Add pagination to admin list endpoints that fetch all records

### Phase 4 -- Risky Removals (Need Confirmation)
10. Remove `backend/` directory (Express/Mongoose code)
11. Remove old Booking.tsx flow + its chain of components
12. Migrate remaining axios-based services to Supabase (large effort, separate task)

## Summary of Expected Impact

| Area | Before | After |
|------|--------|-------|
| Unused component files | 6+ dead files | 0 |
| Dead npm packages | 4 packages (~550KB) | Removed |
| Non-lazy route imports | 6 heavy pages eager-loaded | All lazy |
| Console.log statements | ~1,900 | ~1,500 (keep errors) |
| React Query caching | No staleTime (refetches constantly) | 5-min stale window |
| Initial bundle size | Includes firebase (~200KB) | Reduced significantly |
| Seat map re-renders | Every parent render | Memoized |

**No UI design or business logic changes.** Only performance and cleanup.

