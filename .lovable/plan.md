

## Phase 2: Full Laundry Partner Management & Student Marketplace

This is a large feature spanning database changes, partner management UI, and student marketplace redesign.

---

### Current State

- **`laundry_partners`** table exists but lacks: address/location, lat/lng, service radius, delivery time, description, images
- **`laundry_items`** and **`laundry_pickup_slots`** are global — not linked to any partner
- **Student `/laundry`** page shows global items with no partner selection
- **Partner dashboard** (`LaundryPartnerDashboard`) only shows assigned orders — no property creation, no items/slots CRUD
- **Sidebar** has a single "Laundry" link instead of sub-items like Mess has ("Manage Mess", "Attendance", etc.)

---

### Database Migration

**1. Add columns to `laundry_partners`:**
- `description TEXT`
- `address TEXT`
- `city TEXT`
- `state TEXT`
- `latitude NUMERIC`
- `longitude NUMERIC`
- `service_radius_km NUMERIC DEFAULT 3`
- `delivery_time_hours INTEGER DEFAULT 48` (estimated turnaround)
- `images TEXT[] DEFAULT '{}'`
- `operating_hours JSONB` (e.g. `{start: "08:00", end: "20:00"}`)

**2. Add `partner_id UUID REFERENCES laundry_partners(id)` to:**
- `laundry_items` (nullable, existing global items stay)
- `laundry_pickup_slots` (nullable, existing global slots stay)

**3. RLS updates** for partner-scoped items and slots using `is_partner_or_employee_of()`.

---

### Partner Side — Sidebar Changes

Update `AdminSidebar.tsx` laundry section to have sub-items (same pattern as Mess):
- **Manage Laundry** → `/partner/laundry` (property creation + management)
- **Laundry Orders** → `/partner/laundry-orders` (existing order dashboard)

---

### Partner Side — Manage Laundry Page (`LaundryPartnerDashboard.tsx` rewrite)

When a partner clicks "Add New Property → Laundry" or goes to Manage Laundry:

**Property Creation Form** (if no laundry_partners record for this user):
- Business Name, Description, Contact Person, Phone, Email
- Address, City, State
- Service Radius (km, default 3)
- Estimated Delivery Time (hours, default 48)
- Operating Hours (start/end time)
- Images upload (reuse existing ImageUpload component)
- Submit → creates `laundry_partners` record with `status: 'pending'`, `is_active: false`

**Property Management** (if record exists):
- Edit property details card
- **Items Tab**: CRUD for `laundry_items` scoped to this partner (`partner_id = this partner's ID`)
  - Add item: emoji icon, name, price, category (clothing/bedding/special)
  - Toggle active/inactive, delete
- **Pickup Slots Tab**: CRUD for `laundry_pickup_slots` scoped to this partner
  - Add slot: name, start time, end time, max orders
  - Toggle active/inactive
- **Orders Tab**: Existing order cards with OTP verification (current LaundryPartnerDashboard behavior)

---

### Student Side — Laundry Marketplace Redesign (`/laundry`)

**Step 0 (NEW): Partner Selection**
- Fetch all active, approved `laundry_partners`
- Show as cards with: business name, description, service area, delivery time, rating/order count
- Optional: filter by area or show "Near You" if browser location available
- Student selects a partner → proceeds to item selection

**Steps 1-4 (existing flow mostly kept):**
- Step 1: Items — fetch `laundry_items` WHERE `partner_id = selected partner`
- Step 2: Address — same as now (room, block, floor, landmark). Pre-fill from active hostel booking if exists.
- Step 3: Schedule — fetch `laundry_pickup_slots` WHERE `partner_id = selected partner`
- Step 4: Review & Pay — same flow. Order created with `partner_id` set to selected partner.

The key change: `createOrder` sets `partner_id` at creation time instead of admin assigning later.

---

### Files to Create/Modify

| File | Changes |
|------|---------|
| **Database migration** | Add columns to `laundry_partners`, add `partner_id` to `laundry_items` + `laundry_pickup_slots`, RLS |
| `src/pages/LaundryPartnerDashboard.tsx` | Full rewrite: property creation form + tabs (Details, Items, Slots, Orders) |
| `src/pages/Laundry.tsx` | Add partner selection step, scope items/slots to selected partner |
| `src/components/admin/AdminSidebar.tsx` | Add Laundry sub-items (Manage Laundry, Laundry Orders) |
| `src/api/laundryCloudService.ts` | Add partner-scoped item/slot queries, update `createOrder` to include `partner_id` |
| `src/pages/admin/AdminLaundry.tsx` | Minor: update admin items/slots tabs to show partner_id column |

---

### Not in Scope (future)
- Geo-distance filtering (lat/lng matching) — will store fields but filtering is simple text-based for now
- Partner ratings/reviews system
- Auto-assignment of nearest partner

