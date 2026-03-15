

## Fix Email Template Preview - 401 Unauthorized

### Root Cause
The preview endpoint in `auth-email-hook` checks `LOVABLE_API_KEY` against the `Authorization` header, but the client sends the **user's session JWT token**. These don't match, so it returns 401.

### Fix

**Option A (simplest):** Change the client to use `supabase.functions.invoke()` instead of raw `fetch`. This automatically sends the anon key and auth headers correctly. Then update the edge function's preview handler to verify the caller is an authenticated admin user via their JWT, instead of checking against `LOVABLE_API_KEY`.

### Changes

**1. `src/components/admin/EmailTemplatesManagement.tsx`**
- Replace raw `fetch` call with `supabase.functions.invoke('auth-email-hook', { body: { type: templateId } })` — but this won't hit the `/preview` subpath. So instead, keep `fetch` but use the anon key + user JWT properly.
- Actually the simplest: just call with anon key in `apikey` header and user JWT in `Authorization`.

**2. `supabase/functions/auth-email-hook/index.ts`**
- Update `handlePreview` to verify the user is authenticated and has admin role (using `getClaims` + `has_role` check) instead of checking `LOVABLE_API_KEY`.

**3. Redeploy** the `auth-email-hook` edge function after changes.

### Files
- `supabase/functions/auth-email-hook/index.ts` — Change preview auth from API key to JWT + admin role check
- `src/components/admin/EmailTemplatesManagement.tsx` — Add `apikey` header to the fetch call

