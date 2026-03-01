

# Use `bookmynook.com` as the Login URL

Since you already have `bookmynook.com` as your custom domain, we'll replace all `window.location.origin` references used for **sharing login URLs** with `https://bookmynook.com`.

Auth redirects (password reset, Google OAuth) will keep using `window.location.origin` so they work correctly in any environment (preview or production).

## Changes

### 1. Create `src/utils/appUrl.ts`
A small helper:
```ts
export const getPublicAppUrl = () => "https://bookmynook.com";
```

### 2. Update `src/components/admin/CreateStudentForm.tsx`
- Import `getPublicAppUrl`
- Replace `window.location.origin` with `getPublicAppUrl()` in `handleCopyCredentials()` (line 148) and in the credentials dialog display (line 271)

### 3. Update `src/pages/AdminStudents.tsx`
- Import `getPublicAppUrl`
- Replace `window.location.origin` with `getPublicAppUrl()` in `handleCopyLoginInfo()` (line 229) and in the Partner Login Info display (line 514)

## Result
Login URLs shared with partners/admins/employees will show as:
- `https://bookmynook.com/partner/login`
- `https://bookmynook.com/admin/login`
- `https://bookmynook.com/student/login`

No other files are affected. Auth redirects (Google login, password reset) remain unchanged.

