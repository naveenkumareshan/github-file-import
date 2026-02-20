
## Admin Panel UI Polish — Complete Plan

### What the User Wants
All admin pages should have:
- **Smaller, proportional headings** (not giant `text-3xl font-bold` H1s everywhere)
- **Better visual hierarchy** — data tables stand out, headings recede
- **Consistent theme-based colours** for badges and status indicators
- **Clean, compact layouts** with proper spacing
- **Good wording** — professional but concise labels

The reference image shows the problem: huge dark `text-3xl font-bold` headings dominate the screen, while actual data is hard to read. The target look is smaller headings, cleaner filter areas, better badge colors, and data-forward layouts.

---

### Pages / Components to Update

| File | Current Problem | Fix |
|---|---|---|
| `src/pages/admin/DepositAndRestrictionManagement.tsx` | `text-3xl font-bold` heading, `grid w-full grid-cols-3` tab (too wide) | Reduce to `text-xl font-semibold`, compact tab list, add breadcrumb |
| `src/components/admin/DepositManagement.tsx` | `text-2xl sm:text-3xl font-bold` heading, oversized filter card, `Cabin` column header | Reduce heading, compact filter row, rename `Cabin` → `Reading Room` in table header |
| `src/components/admin/RefundManagement.tsx` | Same large heading pattern | Same fixes |
| `src/pages/AdminBookings.tsx` | Already improved from previous work — just verify breadcrumb and description are compact | Minor: verify text sizes consistent |
| `src/components/admin/SeatTransferManagement.tsx` | Missing page heading; filter card is large; booking list cards are dense | Add compact page header, tighten filter layout, add subtle row styling |
| `src/components/admin/SeatTransferManagementHistory.tsx` | Same issues | Same fixes |
| `src/pages/admin/ManualBookingManagement.tsx` | `text-2xl font-semibold` raw heading with no breadcrumb; raw `<h2>` for User Bookings section; raw `<table>` with plain styling | Add breadcrumb header, compact card-based layout, replace raw table with styled Table component for bookings list |
| `src/pages/AdminStudents.tsx` | Large `text-xl font-bold` heading OK, but `border-cabin-wood` spinner class, `text-3xl` inside dialogs | Fix spinner class, tighten dialog heading sizes |
| `src/components/admin/CouponManagement.tsx` | Missing page header with breadcrumb; "Cabin Only" in Applicable For filter | Add compact page header; rename filter label "Reading Room" |
| `src/components/admin/VendorApproval.tsx` | `text-3xl font-bold` heading; "Cabin" in Business Type filter value label | Reduce heading size, rename Business Type option label |
| `src/pages/admin/ReviewsManagement.tsx` | `text-2xl font-bold` heading; review cards have no compact mode; `Select cabin` placeholder text | Compact heading, `Select reading room` placeholder, tighter review cards |
| `src/pages/AdminDashboard.tsx` | Already improved — verify sizes | Minor check |

---

### Design Rules Applied Consistently

**Headings hierarchy:**
```
Page title:      text-lg font-semibold   (was text-2xl/3xl font-bold)
Card titles:     text-sm font-semibold text-muted-foreground uppercase tracking-wide
Section labels:  text-xs font-medium text-muted-foreground
```

**Breadcrumb pattern (applied to all pages missing it):**
```
Admin Panel / Key Deposits
```

**Badge colour system:**
```
completed / approved / active → green (bg-green-100 text-green-700)
pending                       → amber (bg-amber-100 text-amber-700)  
failed / rejected / inactive  → red   (bg-red-100 text-red-700)
refunded                      → blue  (bg-blue-100 text-blue-700)
```

**Filter areas:**
- Compact inline grid (`gap-3` not `gap-6`)
- Labels are `text-xs` not `text-sm`
- Filter card uses `CardContent className="p-4"` not default padding

**Tables:**
- `TableHead` uses `text-xs font-medium uppercase tracking-wide text-muted-foreground`
- Alternating row colors: `bg-muted/20` on even rows
- Compact `py-2` cells

---

### Specific Text/Label Fixes

| Location | Old Text | New Text |
|---|---|---|
| `DepositManagement.tsx` table header | `Cabin` | `Reading Room` |
| `CouponManagement.tsx` filter | `Cabin Only` | `Reading Room` |
| `VendorApproval.tsx` filter | `Cabin` | `Reading Room` |
| `ManualBookingManagement.tsx` tab content | `Cabin` type badge in bookings | `Reading Room` |
| `ReviewsManagement.tsx` | `Select cabin` placeholder | `Select reading room` |
| `DepositManagement.tsx` heading | `{type} Management` (rendered as `"Deposits Management"`) | Removed — the tab already says "Deposits", heading becomes redundant sub-label |
| `ManualBookingManagement.tsx` label | `key Deposite` | `Key Deposit` |
| `SeatTransferManagement.tsx` | Missing page-level heading | Add: "Seat Transfer · Manage and track seat changes" |
| `SeatTransferManagementHistory.tsx` | Missing page heading | Add: "Transfer History" |

---

### Files to Edit

1. `src/pages/admin/DepositAndRestrictionManagement.tsx` — heading size, tab width fix
2. `src/components/admin/DepositManagement.tsx` — heading size, filter compaction, table header rename
3. `src/pages/AdminBookings.tsx` — verify/minor badge class polish
4. `src/components/admin/SeatTransferManagement.tsx` — add page header, compact filter, styled table rows
5. `src/components/admin/SeatTransferManagementHistory.tsx` — same as above
6. `src/pages/admin/ManualBookingManagement.tsx` — breadcrumb header, label typo fix, bookings table styling
7. `src/pages/AdminStudents.tsx` — fix spinner class, tighten dialog
8. `src/components/admin/CouponManagement.tsx` — add page header, fix filter label
9. `src/components/admin/VendorApproval.tsx` — reduce heading, fix Business Type filter label
10. `src/pages/admin/ReviewsManagement.tsx` — reduce heading, fix placeholder, compact review cards

### What is NOT Changed
- No logic, API calls, variable names, or routes
- No field names or form values
- No backend files
- No component names or file names
- All existing functionality preserved exactly
