

## Three Changes: Host to Partner, Remove Hot Selling, Fix Image Upload

### 1. Rename "Host" to "Partner" everywhere in UI text

All user-facing occurrences of "Host" will be changed to "Partner". Internal variable names (vendor, host) stay unchanged.

**Files to edit:**

| File | Change |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | "Hosts" sidebar item -> "Partners"; `case 'vendor': return 'Host'` -> `return 'Partner'` |
| `src/components/AdminLayout.tsx` | `"/admin/vendors": "Hosts"` -> `"Partners"`; `"Host" Panel` -> `"Partner"` |
| `src/components/admin/VendorApproval.tsx` | All "Host" text in toasts, headers, breadcrumbs, dialog titles -> "Partner" (~15 occurrences) |
| `src/components/admin/VendorDetailsDialog.tsx` | "Host Details", "Host ID", "Host Actions", "Approve Host", "Reject Host", "Suspend Host" -> "Partner" (~15 occurrences) |
| `src/components/admin/VendorStatsCards.tsx` | "Total Hosts" -> "Total Partners" |
| `src/pages/admin/AdminPayouts.tsx` | "Total Hosts" -> "Total Partners" |
| `src/components/vendor/VendorProfile.tsx` | "Host ID:" -> "Partner ID:" |
| `src/pages/vendor/VendorLogin.tsx` | "Host Portal", "Host (Vendor)", "Host Employee", "Host staff", "New Host?" -> Partner equivalents |
| `src/pages/vendor/VendorRegister.tsx` | "Host Partnership Application", "Your Host application" -> "Partner Application", "Your Partner application" |
| `src/pages/vendor/VendorDashboard.tsx` | "Host Dashboard" -> "Partner Dashboard" |
| `src/pages/HostDashboard.tsx` | "Host Dashboard", "hostName: Host" -> "Partner Dashboard", "partnerName" |

---

### 2. Remove "Mark Hot" / "Hot Selling" from all places

Remove the hot selling toggle buttons, filter options, legend items, status labels, and visual indicators. Internal `isHotSelling` property remains in data types (no backend breaking change) but UI no longer shows or uses it.

**Files to edit:**

| File | Change |
|---|---|
| `src/pages/SeatManagement.tsx` | Remove `handleToggleHotSelling` function; remove "Hot Selling" switch in seat details panel; remove hot selling status from `seatDetails` display |
| `src/pages/vendor/VendorSeats.tsx` | Remove `handleToggleHotSelling` function; remove "Mark Hot" / "Remove Hot" buttons in card and table views; remove "hot-selling" filter option from status Select; simplify `getSeatStatus()` to remove hot check; simplify badge color logic |
| `src/components/seats/SeatMapEditor.tsx` | Remove hot selling color case (`bg-[#FFDEE2]`); remove "Hot Selling (+₹25)" legend item; remove hot selling tooltip text; treat hot seats as regular available |
| `src/components/seats/SeatGridMap.tsx` | Same: remove hot selling color, legend item, tooltip text |
| `src/components/RoomSeatLegend.tsx` | Remove "Hot Selling" legend box |
| `src/components/RoomSeatButton.tsx` | Remove `hot` from `SeatStatus` type and color map |
| `src/components/SelectedSeatInfo.tsx` | Remove the hot selling message block |

---

### 3. Fix image upload for Reading Room and Hostel creation forms

The `ImageUpload` component works fine -- it calls the backend upload API. The issue is that the `CabinForm.tsx` and `RoomForm.tsx` already include the `<ImageUpload>` component. I need to verify if the hostel form also has it.

Looking at the code, `CabinForm.tsx` (line ~230) and `RoomForm.tsx` (line ~230) both already render `<ImageUpload>`. The problem the user reports ("no table to upload image") likely means the upload component is not visible or not working. Since the `ImageUpload` component calls `uploadService.uploadImage()` which hits the backend API, and the backend may not be running in this preview, the upload button might fail silently.

However, I'll check and ensure the `HostelForm.tsx` also includes image upload capability, and that the `ImageUpload` component is properly rendered in all creation forms.

**Files to verify/edit:**

| File | Change |
|---|---|
| `src/components/admin/HostelForm.tsx` | Verify image upload field exists; add `ImageUpload` component if missing |
| `src/components/admin/CabinForm.tsx` | Already has ImageUpload -- no change needed |
| `src/components/admin/RoomForm.tsx` | Already has ImageUpload -- no change needed |

---

### Technical Summary

- **~15 files** will be edited
- Only UI text changes for Host -> Partner
- Hot selling removal is UI-only (data model untouched)
- No route, API, or backend changes
- No database changes needed
