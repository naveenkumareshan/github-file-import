

## Security Cleanup: Remove All Hardcoded Credentials

### Findings

**5 locations with hardcoded passwords found:**

| File | Secret | Type |
|---|---|---|
| `src/pages/AdminLogin.tsx` | `Admin@123`, `Super@123` | Demo login passwords visible in UI |
| `src/pages/StudentLogin.tsx` | `Student@123` | Demo login password visible in UI |
| `src/pages/vendor/VendorLogin.tsx` | `Host@123`, `Employee@123` | Demo login passwords visible in UI |
| `supabase/functions/seed-demo-users/index.ts` | All 5 demo passwords | Hardcoded in edge function |
| `backend/controllers/socialAuth.js` | `Inhale123` (x3) | Default password for social auth users |
| `backend/config/passport.js` | `Inhale123` | Default password for Google OAuth users |
| `backend/controllers/adminBulkBookings.js` | `Inhale123` | Default password for bulk-created users |

**1 Firebase API key** in `public/firebase-messaging-sw.js` -- This is a **publishable client-side key** (safe to keep in code, not a secret).

---

### Remediation Plan

#### 1. Remove Demo Credentials from Login Pages

**Files:** `src/pages/AdminLogin.tsx`, `src/pages/StudentLogin.tsx`, `src/pages/vendor/VendorLogin.tsx`

- Remove the hardcoded `demoAccounts` arrays that contain plaintext emails and passwords
- Remove the `DemoCredentials` component usage from all three login pages
- Keep the login forms functional -- just remove the "Quick Access" demo credential panels

#### 2. Remove Seed Function with Hardcoded Passwords

**File:** `supabase/functions/seed-demo-users/index.ts`

- Delete this entire edge function -- it contains all 5 demo passwords hardcoded
- This function should never exist in production code

#### 3. Replace Hardcoded Passwords in Backend Controllers

**Files:** `backend/controllers/socialAuth.js`, `backend/config/passport.js`, `backend/controllers/adminBulkBookings.js`

- Replace `'Inhale123'` with a cryptographically random password generator
- Use `crypto.randomBytes(16).toString('hex')` to generate unique passwords for each auto-created user
- These users authenticate via social login (Google/Facebook), so the password is never used directly -- it just needs to exist and be unique

#### 4. Rotate Compromised Credentials (Manual Step)

Since these passwords have been in Git history, any demo accounts using them should have their passwords changed:
- The 5 demo accounts (`admin@`, `superadmin@`, `student@`, `host@`, `employee@inhalestays.com`) should be deleted or have passwords rotated via the backend admin panel
- This is a manual step the project owner must perform

---

### Technical Details

**Files to modify (6):**

| File | Change |
|---|---|
| `src/pages/AdminLogin.tsx` | Remove `demoAccounts` array and `DemoCredentials` component |
| `src/pages/StudentLogin.tsx` | Remove `demoAccounts` array and `DemoCredentials` component |
| `src/pages/vendor/VendorLogin.tsx` | Remove `demoAccounts` array and `DemoCredentials` component |
| `backend/controllers/socialAuth.js` | Replace `'Inhale123'` with `crypto.randomBytes(16).toString('hex')` |
| `backend/config/passport.js` | Replace `'Inhale123'` with random password |
| `backend/controllers/adminBulkBookings.js` | Replace `'Inhale123'` with random password |

**Files to delete (1):**

| File | Reason |
|---|---|
| `supabase/functions/seed-demo-users/index.ts` | Contains all demo passwords hardcoded |

**No database changes needed.**

### What This Does NOT Fix

- **Git history**: Lovable does not provide tools to rewrite Git history. The passwords will remain in past commits. This is why rotating the actual credentials (step 4) is essential.
- **Firebase API key**: This is a publishable client-side key, not a secret. It is safe in code and does not need removal.

