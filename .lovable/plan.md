

## Plan: Partner Public Page + Demo Enquiry System

### What We're Building

1. **A new public-facing partner landing page** (`/partner-with-us`) — a polished marketing page showcasing InhaleStays benefits, with a "Request Demo" form and a "Call Us" button. This replaces the current `/partner/onboard` registration-heavy approach with a lead-capture-first flow.

2. **A `partner_enquiries` database table** to store demo requests with name, phone, email, city, property type interest, message, and status tracking.

3. **An admin "Partner Enquiries" management page** to view, filter, and update enquiry statuses (new → contacted → converted → closed).

4. **Sidebar integration** — add "Partner Enquiries" under the existing admin Partners menu.

---

### Database

Create a `partner_enquiries` table:
- `id` (uuid, PK)
- `name` (text, not null)
- `phone` (text, not null)
- `email` (text, nullable)
- `city` (text, nullable)
- `property_types` (text[], not null) — e.g. `['reading_room', 'hostel']`
- `message` (text, nullable)
- `status` (text, default `'new'`) — new, contacted, follow_up, converted, closed
- `admin_notes` (text, nullable)
- `serial_number` (text, unique)
- `created_at`, `updated_at` (timestamptz)

RLS: Insert open to anonymous/public (no auth needed for enquiry form). Select/update admin-only via `has_role`.

Serial trigger using `generate_serial_number('PENQ')`.

---

### New Public Page: `/partner-with-us`

A clean marketing page with sections:
1. **Hero** — headline, subtitle, two CTAs: "Request a Demo" (scroll to form) + "Call Us" (tel: link)
2. **Property type selector** (Reading Room, Hostel, Mess, Laundry) — toggles which features show
3. **Features grid** — property-specific + common features (reuse existing data from PartnerOnboard)
4. **Stats/Trust section** — partner count, cities, student reach
5. **How it works** — 4-step flow
6. **Testimonials** placeholder
7. **Request Demo form** — Name, Phone, Email (optional), City, Property types (multi-select), Message. Inserts directly into `partner_enquiries` via Supabase client (anon insert allowed by RLS). Success toast + form reset.
8. **FAQ accordion**
9. **Footer CTA** with phone number

Also add "Mess" as a property type option (alongside Reading Room, Hostel, Laundry).

---

### Admin Enquiries Page: `/admin/partner-enquiries`

- Table with columns: S.No, Serial, Name, Phone, Email, City, Property Types (badges), Status (badge with color), Date, Actions
- Status filter tabs: All, New, Contacted, Follow Up, Converted, Closed
- Click row to expand/edit: update status, add admin notes
- Uses `AdminTablePagination` and `getSerialNumber` per existing standards
- Soft Teal theme for status badges per UI standards

---

### Routing & Sidebar Changes

**App.tsx:**
- Add `/partner-with-us` as a public route inside `MobileAppLayout`
- Add `/admin/partner-enquiries` inside admin layout routes
- Lazy import both new pages

**AdminSidebar.tsx:**
- Add `{ title: 'Enquiries', url: '/admin/partner-enquiries', icon: Phone, roles: ['admin'] }` to the Partners submenu

---

### Files to Create
- `src/pages/partner/PartnerWithUs.tsx` — new public landing page
- `src/pages/admin/PartnerEnquiries.tsx` — admin enquiries management

### Files to Modify
- `src/App.tsx` — add routes
- `src/components/admin/AdminSidebar.tsx` — add Enquiries menu item
- Database migration — create `partner_enquiries` table with RLS + serial trigger

