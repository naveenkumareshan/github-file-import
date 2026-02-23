

## Migrate to Cloud-Native Backend: Remove Localhost Dependency

This plan migrates the image upload system and admin cabin CRUD operations from the Express/localhost backend to Lovable Cloud, making the app fully self-contained. We'll tackle this in phases, starting with the most critical pieces (uploads and cabin management) that are currently broken.

---

### Phase 1: Create Storage Bucket for Cabin Images

**Database migration:**
- Create a `cabin-images` storage bucket (public, so images can be displayed without auth)
- Add RLS policies: public read, authenticated users can upload/delete
- Add an `images` text array column to the `cabins` table

---

### Phase 2: Rewrite Upload Service to Use Cloud Storage

**File: `src/api/uploadService.ts`** -- Complete rewrite

Replace all axios/localhost calls with Supabase Storage SDK:
- `uploadImage(file)` -- uploads to `cabin-images` bucket, returns public URL
- `deleteImage(imageUrl)` -- extracts path from URL, deletes from bucket
- `uploadMultipleImages(files)` -- uploads multiple files, returns array of public URLs
- `uploadCabinImage(cabinId, file)` -- uploads to `cabin-images/{cabinId}/` folder

Each upload generates a UUID filename, uploads via `supabase.storage.from('cabin-images').upload()`, and returns the public URL via `getPublicUrl()`.

---

### Phase 3: Rewrite Admin Cabins Service to Use Cloud Database

**File: `src/api/adminCabinsService.ts`** -- Complete rewrite

Replace all axios calls with Supabase SDK queries:
- `getAllCabins(filters)` -- `supabase.from('cabins').select('*')` with optional filters
- `getCabinById(id)` -- `.select('*').eq('id', id).single()`
- `createCabin(data)` -- `.insert(data)`
- `updateCabin(id, data)` -- `.update(data).eq('id', id)`
- `deleteCabin(id)` -- `.update({ is_active: false }).eq('id', id)` (soft delete)
- `restoreCabin(id)` -- `.update({ is_active: true }).eq('id', id)`

Remove axios import entirely.

---

### Phase 4: Update ImageUpload Component

**File: `src/components/ImageUpload.tsx`**

- Remove `VITE_BASE_URL` / localhost reference
- Update image `src` to use the full public URL returned from cloud storage directly (no prefix needed)
- Handle both old-format URLs (relative paths like `/uploads/xxx.png`) and new cloud URLs (full `https://` URLs)
- Add delete from cloud storage on remove

---

### Phase 5: Update CabinEditor Component

**File: `src/components/admin/CabinEditor.tsx`**

- Remove `VITE_BASE_URL` / localhost reference
- Update image display to handle cloud URLs (full URLs don't need a prefix)
- Helper function: if URL starts with `http`, use as-is; otherwise treat as legacy

---

### Phase 6: Update All Image Display References

Update `VITE_BASE_URL` references across ~15 files to handle cloud URLs properly. For each file, add a helper that checks if the URL is already absolute (starts with `http`) and uses it directly, or falls back to legacy prefix.

**Files to update:**
- `src/components/CabinImageSlider.tsx`
- `src/components/admin/AdminBookingsList.tsx`
- `src/components/admin/HostelRoomForm.tsx`
- `src/components/admin/AddRoomWithSharingForm.tsx`
- `src/components/admin/VendorDetailsDialog.tsx`
- `src/components/vendor/VendorDocumentUpload.tsx`
- `src/pages/AdminBookingDetail.tsx`
- `src/pages/Hostels.tsx`
- `src/pages/HostelBooking.tsx`
- `src/pages/HostelRoomDetails.tsx`

Each gets a shared utility function `getImageUrl(path)` that returns full URL for cloud images or prefixed URL for legacy images.

---

### Phase 7: Update RoomManagement Page

**File: `src/pages/RoomManagement.tsx`**

- Update `handleSaveCabin` to map cabin data to the Supabase column format (snake_case: `is_active`, `image_url`, etc.)
- Remove `_id` references, use `id` consistently (Supabase uses UUID `id`)
- Update `fetchCabins` to work with the new Supabase-based `adminCabinsService`

---

### Technical Summary

**New storage bucket:** `cabin-images` (public)

**Database migration:** Add `images text[]` column to `cabins` table

**Files modified (14+ files, no new files):**

| File | Change |
|---|---|
| `src/api/uploadService.ts` | Rewrite: axios to Supabase Storage |
| `src/api/adminCabinsService.ts` | Rewrite: axios to Supabase SDK |
| `src/components/ImageUpload.tsx` | Remove localhost, use cloud URLs |
| `src/components/admin/CabinEditor.tsx` | Remove localhost, use cloud URLs |
| `src/pages/RoomManagement.tsx` | Adapt to Supabase data format |
| `src/components/CabinImageSlider.tsx` | Smart URL handling |
| `src/components/admin/AdminBookingsList.tsx` | Smart URL handling |
| `src/components/admin/HostelRoomForm.tsx` | Smart URL handling |
| `src/components/admin/AddRoomWithSharingForm.tsx` | Smart URL handling |
| `src/components/admin/VendorDetailsDialog.tsx` | Smart URL handling |
| `src/components/vendor/VendorDocumentUpload.tsx` | Smart URL handling |
| `src/pages/AdminBookingDetail.tsx` | Smart URL handling |
| `src/pages/Hostels.tsx` | Smart URL handling |
| `src/pages/HostelBooking.tsx` | Smart URL handling |
| `src/pages/HostelRoomDetails.tsx` | Smart URL handling |
| `src/lib/utils.ts` | Add `getImageUrl()` helper |

**New utility function** in `src/lib/utils.ts`:
```text
getImageUrl(path) -> if starts with "http" return as-is, else return legacy prefix + path
```

**What stays unchanged (for now):**
- The 38 other axios-based API services (bookings, seats, transactions, etc.) -- these are a separate, larger migration
- The Express backend code in `/backend` -- remains but is no longer required for cabins/uploads
- Student panel -- completely untouched

**Result after implementation:**
- Cabin creation, editing, and image upload work in preview and production
- No localhost dependency for cabin/upload features
- Images stored in cloud storage with permanent public URLs
- Clean fallback for any legacy image URLs

