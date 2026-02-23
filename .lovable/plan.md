

## Implementation Plan: Fix Duplicates, Compact Cards, and Image Upload

### 1. Remove Duplicate Breadcrumbs (6 files)

The `AdminLayout` already renders breadcrumbs at the top. These 6 files duplicate them inline:

| File | Lines to remove |
|---|---|
| `src/pages/admin/SeatTransferManagement.tsx` | Lines 14-18 (breadcrumb div) |
| `src/components/admin/VendorApproval.tsx` | Lines 318-322 (breadcrumb div) |
| `src/pages/RoomManagement.tsx` | Lines 371-375 (breadcrumb div) |
| `src/pages/hotelManager/HostelManagement.tsx` | Lines 156-159 (breadcrumb div) |
| `src/pages/hotelManager/AdminHostelBookings.tsx` | Lines 76-79 (breadcrumb div) |
| `src/pages/admin/ReviewsManagement.tsx` | Lines 167-170 (breadcrumb div) |
| `src/pages/admin/ManualBookingManagement.tsx` | Lines 789-792 (breadcrumb div) |

Each will keep only `h1` title and `p` description.

---

### 2. Compact VendorStatsCards

**File: `src/components/admin/VendorStatsCards.tsx`**

Replace `CardHeader` + `CardContent` pattern with compact `p-3` layout:
- Remove `CardHeader`, `CardTitle` imports usage
- Each card becomes: `Card` with `shadow-none border` > single `div p-3` > icon + label row + bold number
- Grid: `gap-3 mb-4` (already `grid-cols-6`)
- Number: `text-xl font-bold` (down from `text-2xl`)
- Label: `text-xs text-muted-foreground`
- Remove subtitle text ("from last month", "Active vendors", etc.)

---

### 3. Compact Filters - Seat Transfer (2 files)

**Files:**
- `src/components/admin/SeatTransferManagement.tsx`
- `src/components/admin/SeatTransferManagementHistory.tsx`

Both have the same filter pattern. Changes:
- Remove all `<Label>` elements
- Replace 2-row grid with `flex flex-wrap items-center gap-2`
- Merge export buttons into the same row
- All inputs keep `h-8 text-sm`
- Remove `Label` from imports

---

### 4. Fix Image Upload for Cabins

**File: `src/components/admin/CabinEditor.tsx`**

Line 165 currently checks:
```
if (!cabin.imageUrl || cabin.imageUrl === "/placeholder.svg")
```

This fails because images are stored in `cabin.images` array, not `imageUrl`. Change to:
```
if ((!cabin.images || cabin.images.length === 0) && (!cabin.imageUrl || cabin.imageUrl === "/placeholder.svg"))
```

This allows cabin creation when images exist in either `images` array or `imageUrl`.

The network error on upload is caused by the backend URL (`VITE_API_URL`) defaulting to `localhost:5000` in the preview environment. This is an external backend dependency -- the upload will only work when the Express backend is running. No change needed here since it's an infrastructure/deployment issue, not a code bug.

---

### Technical Summary

**Files modified (9 files total, no new files):**

| File | Change |
|---|---|
| `src/pages/admin/SeatTransferManagement.tsx` | Remove duplicate breadcrumb |
| `src/components/admin/VendorApproval.tsx` | Remove duplicate breadcrumb |
| `src/pages/RoomManagement.tsx` | Remove duplicate breadcrumb |
| `src/pages/hotelManager/HostelManagement.tsx` | Remove duplicate breadcrumb |
| `src/pages/hotelManager/AdminHostelBookings.tsx` | Remove duplicate breadcrumb |
| `src/pages/admin/ReviewsManagement.tsx` | Remove duplicate breadcrumb |
| `src/pages/admin/ManualBookingManagement.tsx` | Remove duplicate breadcrumb |
| `src/components/admin/VendorStatsCards.tsx` | Compact card layout |
| `src/components/admin/SeatTransferManagement.tsx` | Single-row filters |
| `src/components/admin/SeatTransferManagementHistory.tsx` | Single-row filters |
| `src/components/admin/CabinEditor.tsx` | Fix image validation |

**No database changes. No new dependencies.**

