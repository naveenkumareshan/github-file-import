
## Admin Partner Creation, Property Linking, and Login Management

### Overview
Enhance the admin's User Management page to support creating Partner accounts (with Supabase auth login credentials), linking existing Reading Rooms and Hostels to partners, and viewing partner login details -- all from the admin panel.

---

### 1. Create "Create Partner" Edge Function

**New file: `supabase/functions/create-partner/index.ts`**

Extend the existing `create-student` pattern to create a partner user:
- Accept: `name`, `email`, `phone`, `password` (admin-set), `businessName` (optional)
- Use `supabaseAdmin.auth.admin.createUser()` with the provided password (not random) and `email_confirm: true`
- Insert into `user_roles` table with role = `vendor`
- Update the `profiles` table with phone and name
- Verify caller is admin via `user_roles` check
- Return the created user ID and password confirmation

This is different from `create-student` because:
- It assigns the `vendor` role instead of `student`
- It uses a password provided by the admin (not random) so the admin can share credentials
- Partners need to log in via the Partner Portal

---

### 2. Revamp "Create User" Page (`src/components/admin/CreateStudentForm.tsx`)

Complete rewrite to match the new high-density admin UI and support creating multiple user types:

- Add a **Role selector** at the top: Student, Partner, Admin, Employee
- When **Partner** is selected:
  - Show fields: Name, Email, Phone, Password, Business Name (optional)
  - Call the new `create-partner` edge function
  - On success, show the login credentials (email + password) in a confirmation dialog
- When **Student** is selected (existing flow):
  - Keep current fields: Name, Email, Phone, Gender
  - Call existing `create-student` edge function
- When **Admin** is selected:
  - Show fields: Name, Email, Phone, Password
  - Call a new variation that assigns `admin` role
- When **Employee** is selected:
  - Show fields: Name, Email, Phone, Password
  - Call a variation that assigns `vendor_employee` role

UI: Compact form matching admin table style (text-xs labels, h-8 inputs)

---

### 3. Add "Link Properties" Feature in Partners Tab

**Changes to `src/pages/AdminStudents.tsx`:**

In the Partners tab, add new actions per partner row:
- **"Link Room"** button: Opens a dialog showing all Reading Rooms (cabins) with a dropdown to select and assign `created_by` to this partner's user ID
- **"Link Hostel"** button: Opens a dialog showing all Hostels with a dropdown to select and assign `created_by` to this partner's user ID
- **"View Properties"** in details dialog: Show linked Reading Rooms and Hostels for each partner

**New service methods in `src/api/adminUsersService.ts`:**
- `getPartnerProperties(userId)`: Fetch cabins and hostels where `created_by = userId`
- `linkCabinToPartner(cabinId, partnerId)`: Update `cabins.created_by` to partner ID
- `linkHostelToPartner(hostelId, partnerId)`: Update `hostels.created_by` to partner ID
- `unlinkProperty(type, propertyId)`: Set `created_by` to null

---

### 4. Partner Login Info in Details Dialog

**Changes to `src/pages/AdminStudents.tsx` (Details Dialog):**

When viewing a Partner's details:
- Show their email (login credential) prominently
- Show linked Reading Rooms and Hostels with names
- Show a "Reset Password" button (already exists)
- Show partner login URL: `/partner/login`
- Add a "Copy Login Info" button that copies email + partner login URL to clipboard

---

### 5. Update Edge Function to Support Multiple Roles

Instead of creating separate edge functions per role, extend `create-partner` to be a general `create-user` function:

**New file: `supabase/functions/admin-create-user/index.ts`**
- Accept: `name`, `email`, `phone`, `password`, `role` (student/vendor/admin/vendor_employee)
- Validate caller is admin
- Create auth user with provided password and email_confirm: true
- Insert appropriate role into `user_roles`
- Update profile with phone/name
- Return userId

This replaces the separate `create-student` call for the form (though the existing function stays for backward compatibility with partner-side student creation).

---

### Technical Details

**Files to create:**
| File | Purpose |
|------|---------|
| `supabase/functions/admin-create-user/index.ts` | Edge function to create any user type with role |

**Files to edit:**
| File | Change |
|------|--------|
| `src/components/admin/CreateStudentForm.tsx` | Add role selector, partner/admin/employee creation, compact UI |
| `src/pages/AdminStudents.tsx` | Add Link Room/Hostel buttons in Partners tab, property display in details |
| `src/api/adminUsersService.ts` | Add partner property linking/fetching methods, createUser method |
| `supabase/config.toml` | Add `admin-create-user` function config with `verify_jwt = false` |

**Database changes:** None required -- existing tables (`profiles`, `user_roles`, `cabins.created_by`, `hostels.created_by`) already support this flow.

**Security:** The edge function validates the caller has `admin` role before creating users. Property linking uses existing RLS policies (admin has ALL access on cabins and hostels).
