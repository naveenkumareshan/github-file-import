

## Fix Duplicate Headers, Compact Cards, and Image Upload

### Problem 1: Duplicate Breadcrumbs on Every Page

The `AdminLayout.tsx` header already renders a breadcrumb ("Admin Panel / Transfer Seat"). But individual page components also render their own breadcrumb + title + description, causing the duplication shown in the screenshot.

**Fix:** Remove the inline breadcrumb from each page component since `AdminLayout` already handles it. Keep only the page title and description (smaller).

**Files to update:**
- `src/pages/admin/SeatTransferManagement.tsx` -- Remove breadcrumb (lines 15-17)
- `src/components/admin/SeatTransferManagement.tsx` -- No breadcrumb to remove (it's wrapped by the page)
- `src/components/admin/VendorApproval.tsx` -- Remove breadcrumb (lines 319-321)
- `src/pages/RoomManagement.tsx` -- Remove breadcrumb (lines 371-374)
- Scan and remove from any other admin pages that duplicate it

### Problem 2: VendorStatsCards Too Large

The partner stats cards use full `CardHeader` + `CardContent` with `text-2xl` numbers and generous padding.

**Fix:** Apply the same compact card pattern used in `DynamicStatisticsCards.tsx`:
- Single `p-3` div inside Card
- `text-xl` for numbers, `text-xs` for labels
- `shadow-none border rounded-lg`
- `gap-3 mb-4` on the grid
- `grid-cols-3 lg:grid-cols-6` layout

### Problem 3: Filters Too Large on Transfer Seat / Transfer History

Both `SeatTransferManagement.tsx` and `SeatTransferManagementHistory.tsx` use Labels + multi-row grids for filters.

**Fix:** Collapse into single horizontal row:
- Remove all `<Label>` elements, use placeholders only
- Use `flex flex-wrap items-center gap-2` layout
- Merge export buttons into the same row
- All inputs `h-8 text-sm`

### Problem 4: Image Upload Network Error

The `ImageUpload` component uploads to the external backend via `uploadService.uploadImage()` which calls `POST /uploads/image`. The `axiosConfig.ts` base URL defaults to `http://localhost:5000/api` when `VITE_API_URL` is not set. In production/preview this will fail with a network error.

**Fix:** The image upload currently depends on the external Express backend. Since the backend URL may not be configured in the preview environment, we need to check the `.env` file for the correct `VITE_API_URL` / `VITE_BASE_URL` values. If they point to localhost, the upload will fail in deployed environments.

Additionally, the `CabinEditor.tsx` validation at line 165 checks `if (!cabin.imageUrl || cabin.imageUrl === '/placeholder.svg')` which blocks creation even when images are in the `images` array. Fix this to check `cabin.images.length > 0` instead.

**Files to update for image upload fix:**
- `src/components/admin/CabinEditor.tsx` -- Fix validation to check `cabin.images.length > 0`

### Technical Summary

**Files to modify (7 files):**

| File | Change |
|---|---|
| `src/pages/admin/SeatTransferManagement.tsx` | Remove duplicate breadcrumb + reduce title spacing |
| `src/components/admin/SeatTransferManagement.tsx` | Collapse filters into single row, remove Labels |
| `src/components/admin/SeatTransferManagementHistory.tsx` | Same filter collapse |
| `src/components/admin/VendorApproval.tsx` | Remove duplicate breadcrumb |
| `src/components/admin/VendorStatsCards.tsx` | Compact card pattern (p-3, text-xl, shadow-none) |
| `src/pages/RoomManagement.tsx` | Remove duplicate breadcrumb |
| `src/components/admin/CabinEditor.tsx` | Fix image validation to check `images.length > 0` instead of `imageUrl` |

**No database changes. No new files.**

