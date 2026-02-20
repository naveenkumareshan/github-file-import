
# Add Demo Login Credentials to All Login Pages

## What This Does

Every login page in the app will get a "Demo Credentials" section — a set of one-click buttons that auto-fill the email and password fields so you can instantly test any role without typing. This covers all 3 login portals with all available roles.

## Login Portals in the App

There are 3 separate login pages, covering all roles:

| Portal | URL | Roles Covered |
|---|---|---|
| Admin Login | `/admin/login` | Admin, Super Admin |
| Student Login | `/student/login` or `/login` | Student / Customer |
| Host (Vendor) Login | `/vendor/login` or `/host/login` | Host (Vendor), Host Employee, Laundry Agent |

## Pages Each Role Can Access

### Admin Role
- Dashboard, Bookings, Seat Transfer, Manual Bookings, Hostel Bookings
- Room Management, Hostel Management, User Management (create/import students)
- Coupons, Reports, Payouts, Settings, Hosts Approval
- Email Reports, Email Templates, Notifications, Reviews, Error Logs
- Location Management, Deposits & Restrictions

### Student / Customer Role
- Student Dashboard (My Bookings)
- Student Profile
- Booking Detail & Transaction View
- Public: Hostels, Cabins, Laundry Request, Book Seat, Book Shared Room

### Host (Vendor) Role
- Dashboard, Deposits & Restrictions
- Reading Rooms, Hostel Management, Reviews
- Bookings (All Transactions, Seat Transfer, Book Seat)
- User Management, Employee List, Payouts, Profile

### Host Employee (vendor_employee) Role
- Dashboard (permission-based)
- Seat Availability Map (if permitted)
- Bookings (if permitted)
- Reports (if permitted)
- Employee list (if permitted)

### Laundry Agent
- Laundry Agent Dashboard at `/laundry-agent` (requires admin role)

## Demo Credentials to Display

The demo credentials shown on each page will be realistic placeholder values. The actual passwords/emails come from your real backend — these UI hints just pre-fill the form so you don't have to type.

### On Admin Login page (`/admin/login`):
- **Admin**: `admin@inhalestays.com` / `Admin@123`
- **Super Admin**: `superadmin@inhalestays.com` / `Super@123`

### On Student Login page (`/student/login`):
- **Student**: `student@inhalestays.com` / `Student@123`

### On Host Login page (`/vendor/login` or `/host/login`):
- **Host (Vendor)**: `host@inhalestays.com` / `Host@123`
- **Host Employee**: `employee@inhalestays.com` / `Employee@123`
- **Laundry Agent** (uses admin role): shown with a note that it requires admin login at `/admin/login`

## Implementation Details

### Component: `DemoCredentials`
A new reusable component `src/components/auth/DemoCredentials.tsx` will be created. It accepts:
- An array of `{ label, email, password, description }` objects
- An `onSelect(email, password)` callback to fill the form fields

It renders a card below the login form with labeled buttons. Clicking a button calls `onSelect`, which updates the parent form state.

### Files to Modify

1. **`src/components/auth/DemoCredentials.tsx`** (NEW FILE)
   - Reusable demo credentials card component
   - Shows role label, email preview, and a "Use" button
   - Clicking auto-fills email + password in parent form

2. **`src/pages/AdminLogin.tsx`**
   - Import and add `<DemoCredentials>` below the login form
   - Pass `setFormData` as the callback so clicking a demo button fills the fields
   - Show: Admin, Super Admin credentials

3. **`src/pages/StudentLogin.tsx`**
   - Import and add `<DemoCredentials>` below the form
   - Show: Student credentials

4. **`src/pages/vendor/VendorLogin.tsx`**
   - Import and add `<DemoCredentials>` below the form
   - Show: Host (Vendor) and Host Employee credentials

### Visual Design
- Shown as a collapsible "Demo Accounts" info card below the form
- Each row: colored badge (role name) + masked email + "Use" button
- Clicking "Use" fills both fields and shows a brief toast: "Demo credentials applied — click Login"
- Uses existing shadcn `Card`, `Badge`, `Button` components — no new dependencies

### Access Rights Summary Card
On each login page, below the demo credentials, a small info box will explain what each role can access — so you know what to test after logging in.
