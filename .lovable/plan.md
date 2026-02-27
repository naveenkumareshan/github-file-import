

## Hostel System: Sample Data, Bed Map, Zolo-Style Booking UI, and Admin Configuration

This plan covers four major areas: seeding sample hostel data, building a visual bed map (floor-wise like reading rooms), creating a Zolo Stays-inspired student booking experience with stay duration packages, and adding admin configuration for these features.

---

### 1. Seed Sample Hostel Data

Insert example hostels, rooms, sharing options, beds, bookings, and receipts into the database using the data insert tool.

**Data to insert:**

- **3 Hostels** in Visakhapatnam (city already exists):
  - "Inhale Stays Men's PG" (Male, Long-term)
  - "Inhale Stays Women's PG" (Female, Both)
  - "Inhale Stays Co-Living" (Co-ed, Short-term)
  - Each with amenities, security deposit, advance booking config, and linked to admin user as `created_by`

- **6 Rooms** (2 per hostel): with floor numbers, categories, amenities

- **12 Sharing Options**: Mix of Single, 2-Sharing, 3-Sharing, 4-Sharing per room with daily and monthly prices

- **~40 Beds**: Distributed across sharing options

- **5 Sample Bookings**: Linked to existing student profiles, with confirmed/pending statuses

- **5 Sample Receipts**: Corresponding to the bookings

- **3 Sample Deposit entries**: Via hostel_bookings with security_deposit > 0

---

### 2. New Database Table: `hostel_stay_packages`

Create a new table to support the Zolo Stays-style stay duration packages (as shown in the reference image: Base Package, 3 Months+, 6 Months+, 11 Months+).

**Schema:**
| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| hostel_id | uuid (FK -> hostels) | Which hostel this package belongs to |
| name | text | e.g. "Base Package", "3 Months or more" |
| min_months | integer | Minimum stay duration |
| discount_percentage | numeric | e.g. 0, 10, 15, 21 |
| deposit_months | numeric | e.g. 1, 1, 1.5, 2 |
| lock_in_months | integer | e.g. 0, 3, 6, 11 |
| notice_months | integer | e.g. 1 |
| description | text | Short summary shown on card |
| is_active | boolean | Default true |
| display_order | integer | Ordering |
| created_at | timestamptz | Default now() |

**RLS policies:**
- Admins: full access
- Partners: manage own hostel packages (via hostels.created_by join)
- Public: view active packages (SELECT where is_active = true)

---

### 3. Hostel Bed Map (Floor-Wise Visual Map)

Create a visual bed map similar to the reading room seat map, showing beds on a floor-by-floor basis.

**New files:**

#### `src/components/hostels/HostelBedMap.tsx`
A visual floor-wise bed map component that:
- Groups beds by floor (from hostel_rooms.floor)
- Shows floor tabs (Floor 1, Floor 2, etc.)
- Renders beds as clickable markers on a grid layout (similar to FloorPlanViewer)
- Color-coded: green = available, blue = occupied, gray = blocked
- Tooltip on hover shows bed number, sharing type, price, current occupant (if occupied)
- Used in both student booking flow and admin management

#### `src/components/hostels/HostelFloorView.tsx`
Individual floor renderer that:
- Shows rooms as bordered sections within the floor
- Beds arranged in a grid within each room section
- Room labels with room number and sharing type
- Occupancy progress bar per room

#### Updates to `src/pages/HostelRoomDetails.tsx`
- Add a "View Bed Map" button that opens a dialog/section showing the floor-wise bed map
- Students can see bed availability visually before selecting a sharing option

#### Updates to `src/components/hostels/RoomBedManagement.tsx`
- Replace the existing basic bed list with the new visual bed map
- Add floor filter tabs
- Show occupancy stats per floor

---

### 4. Zolo Stays-Style Student Booking UI

Redesign the student hostel booking flow to match the reference image pattern.

#### `src/components/hostels/StayDurationPackages.tsx`
A new component displaying stay duration packages as selectable cards:
- Each card shows: package name, price per month, description (deposit, lock-in, notice period)
- "View Details" expandable section
- "SAVE Rs X/MONTH" badge for discounted packages
- Radio-style selection (one package at a time)
- Calculates discounted price based on sharing option's monthly price and package discount percentage

#### Updates to `src/pages/HostelRoomDetails.tsx`
- After selecting a sharing option, show the stay duration packages
- Add "Schedule a Visit" button (opens contact info) and "Confirm Details" button
- Bottom banner: "To book for less than 30 days, Contact [phone]"
- Mobile-optimized card layout matching the reference design

#### Updates to `src/pages/HostelBooking.tsx`
- Accept the selected package from navigation state
- Calculate pricing using package discount
- Show deposit amount based on package's deposit_months setting
- Display lock-in period and notice period in the booking summary

---

### 5. Admin Configuration for Stay Packages

#### `src/components/admin/HostelStayPackageManager.tsx`
Admin/partner component to configure stay duration packages per hostel:
- Table listing existing packages with edit/delete
- Form to add new packages: name, min months, discount %, deposit months, lock-in, notice period
- Toggle active/inactive
- Drag to reorder (display_order)

#### Integration into Hostel Management
- Add a "Stay Packages" tab in the hostel room detail/management view
- Partners can configure packages for their own hostels
- Admins can manage packages for any hostel

---

### 6. API Service Layer

#### `src/api/hostelStayPackageService.ts`
New service file for CRUD operations on `hostel_stay_packages`:
- `getPackages(hostelId)` - get active packages for a hostel
- `createPackage(data)` - create new package
- `updatePackage(id, data)` - update existing
- `deletePackage(id)` - remove package
- `reorderPackages(hostelId, orderedIds)` - update display order

---

### Files Summary

| File | Action |
|---|---|
| Database: `hostel_stay_packages` table | New migration |
| Database: Sample data insert | Insert via tool |
| `src/api/hostelStayPackageService.ts` | New |
| `src/components/hostels/HostelBedMap.tsx` | New -- floor-wise visual bed map |
| `src/components/hostels/HostelFloorView.tsx` | New -- individual floor renderer |
| `src/components/hostels/StayDurationPackages.tsx` | New -- Zolo-style package selector |
| `src/components/admin/HostelStayPackageManager.tsx` | New -- admin package config |
| `src/pages/HostelRoomDetails.tsx` | Edit -- add bed map + packages UI |
| `src/pages/HostelBooking.tsx` | Edit -- integrate package pricing |
| `src/components/hostels/RoomBedManagement.tsx` | Edit -- use visual bed map |

### Technical Notes

- The bed map reuses the zoom/pan pattern from `FloorPlanViewer` but adapted for hostel beds grouped by room sections within each floor
- Stay packages are hostel-level (not room-level) since discount policies apply uniformly across all sharing options in a hostel
- Package pricing: `effective_price = sharing_option.price_monthly * (1 - package.discount_percentage / 100)`
- Sample data uses the existing admin user ID (`8a0ee35f-90a4-4657-bda3-d53f07eebb03`) as `created_by` and Visakhapatnam city
- All new tables include proper RLS policies matching the existing hostel access pattern (admin full, partner own, public read)

