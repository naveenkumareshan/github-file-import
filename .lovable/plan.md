

## Partner Lead CRM System - Implementation Plan

### Current State
- An existing `partner_enquiries` table stores leads from the public "Partner With Us" page (name, phone, email, city, property_types, message, status, admin_notes)
- Admin-only view at `/admin/partner-enquiries` with basic status management
- Partners have NO lead management capability -- this is the core gap

### What We'll Build

A full Mini CRM for partners to track their own customer enquiries (students looking for PG/hostel/reading room/laundry/mess), plus an admin overview panel.

---

### Database Changes (2 new tables, 1 migration)

**Table: `partner_leads`**
- `id` uuid PK
- `partner_id` uuid FK → profiles(id) NOT NULL (the partner who owns this lead)
- `name` text NOT NULL
- `phone` text NOT NULL
- `category` text NOT NULL (hostel, pg, reading_room, laundry, mess)
- `source` text NOT NULL DEFAULT 'walk_in' (walk_in, app, call, referral)
- `status` text NOT NULL DEFAULT 'new_lead' (new_lead, contacted, interested, visit_scheduled, converted, not_interested)
- `serial_number` text (auto-generated via trigger)
- `created_at`, `updated_at` timestamps

**Table: `partner_lead_notes`**
- `id` uuid PK
- `lead_id` uuid FK → partner_leads(id) ON DELETE CASCADE
- `user_id` uuid FK → profiles(id) (who wrote the note)
- `remark` text NOT NULL
- `created_at` timestamp

**RLS Policies:**
- Partners/employees can CRUD their own leads via `is_partner_or_employee_of(partner_id)`
- Admins can SELECT all leads (for the admin overview panel)

**Realtime:** Enable realtime on `partner_leads` for live status updates.

---

### Frontend: Partner Side (4 new components)

**1. `src/pages/partner/PartnerLeads.tsx`** - Main leads page
- Top stats row: Total Leads, Converted, Conversion %, Today's, This Week's, Pending Follow-ups
- Toggle between **List View** (default) and **Kanban View**
- Floating "+ Add Lead" FAB button (mobile-first)
- Filters: status, category, date range
- Search by name/phone

**2. `src/components/partner/LeadKanbanBoard.tsx`** - Kanban view
- 6 columns: New Lead → Contacted → Interested → Visit Scheduled → Converted → Not Interested
- Drag-and-drop between columns (using native HTML drag API for zero dependencies)
- Each card shows name, phone, category badge, source badge, time ago
- Click card → opens detail sheet

**3. `src/components/partner/LeadDetailSheet.tsx`** - Lead detail (Sheet/Drawer)
- Full lead info with click-to-call phone
- Status dropdown to change stage
- WhatsApp button with prefilled message: "Hi, this is from [Partner Name] regarding your enquiry"
- Timeline-style notes section (newest first)
- Add note input with timestamp

**4. `src/components/partner/AddLeadDialog.tsx`** - Quick-add modal
- Minimal fields: Name, Phone (required), Category dropdown, Source dropdown
- Status defaults to "New Lead"
- Submission in under 5 seconds -- auto-close on success

---

### Frontend: Admin Side (1 new component)

**5. `src/pages/admin/AdminLeadOverview.tsx`** - Admin lead analytics
- View all partner leads across the platform
- Per-partner performance table: Partner Name, Total Leads, Converted, Conversion Rate %
- Funnel visualization showing drop-off at each stage
- Filter by date range

---

### Routing & Navigation Changes

**`src/App.tsx`:**
- Add `partner/leads` route under partner layout
- Add `admin/lead-overview` route under admin layout

**`src/hooks/usePartnerNavPreferences.ts`:**
- Add `{ key: 'leads', label: 'Leads', url: '/partner/leads', icon: 'UserPlus', category: 'general' }` to `ALL_NAV_OPTIONS`

**`src/components/partner/PartnerMoreMenu.tsx`:**
- Add "Leads CRM" link under Operations section

**`src/components/admin/AdminSidebar.tsx`:**
- Add "Lead Overview" under the Partners section

**`src/components/AdminLayout.tsx`:**
- Add route labels for new pages

---

### Technical Details

- All queries scoped via `partnerUserId` / `getEffectiveOwnerId` pattern (consistent with existing codebase)
- Kanban drag uses `onDragStart`/`onDragOver`/`onDrop` with optimistic UI updates
- Stats computed client-side from the leads array (no separate RPC needed for partner-level)
- Admin overview uses a single query with profile join for partner names
- Mobile-first: cards, soft shadows, rounded corners, matching existing SaaS design system
- Real-time subscription on `partner_leads` table for live status changes

