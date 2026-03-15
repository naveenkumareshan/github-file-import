
Goal: Make linked hostel names reliably visible in Manage Mess, without more trial-and-error, and verify link/subscription/attendance flows in one pass.

What I found
- The current UI query path is still fragile because it depends on multi-table RLS + embedded joins in the client (`hostel_mess_links -> hostels`) and silently falls back to “No hostel linked” when link fetch fails/filters out.
- Even with the recent policy changes, this can still fail per-user/session context (owner vs employee vs admin), which is why you still see wrong output after refresh.

Implementation plan

1) Replace fragile client-side embedded join with server-side secure RPC
- Add a backend function (security definer) that returns linked hostels for a list of mess IDs:
  - input: `p_mess_ids uuid[]`
  - output: `mess_id, hostel_id, hostel_name, is_default`
  - access logic inside function:
    - allow admin
    - allow mess owner / active employee of mess owner
- This removes dependency on client-side nested join behavior under RLS and returns a deterministic result.

2) Add symmetrical RPC for hostel screen (consistency)
- Add second function for linked messes by hostel IDs:
  - input: `p_hostel_ids uuid[]`
  - output: `hostel_id, mess_id, mess_name, is_default`
- Keeps Hostel Management and Mess Management using the same reliable pattern.

3) Update Manage Mess UI to use RPC output
- File: `src/pages/admin/MessManagement.tsx`
- Keep existing cards and badges, but fetch links using RPC and map directly.
- Add explicit error handling:
  - if RPC fails, show a destructive toast and keep previous map (no false “No hostel linked” overwrite).
- Ensure fetch waits for auth-ready user before initial load (`user?.id` guard), preventing edge cases from early empty fetches.

4) Update Hostel Management UI to use RPC output
- File: `src/pages/hotelManager/HostelManagement.tsx`
- Same pattern as above for deterministic linked mess display and robust error handling.

5) Keep security strict
- No broad public-read policies.
- No role in profile/users table changes.
- Access remains controlled via authenticated user + server-side ownership checks.

Files to change
- `supabase/migrations/<new>.sql`
  - create `get_mess_linked_hostels(p_mess_ids uuid[])`
  - create `get_hostel_linked_messes(p_hostel_ids uuid[])`
  - grant execute to authenticated
- `src/pages/admin/MessManagement.tsx`
  - swap join query -> RPC call
  - strengthen loading/error/update behavior
- `src/pages/hotelManager/HostelManagement.tsx`
  - swap join query -> RPC call
  - strengthen loading/error/update behavior

Verification checklist (single pass)
- As mess owner: linked hostel chip appears (not “No hostel linked”).
- As hostel owner: linked mess chip appears.
- As admin: both sides show links.
- As employee of owner: visibility matches owner permissions.
- Linked subscription + attendance screens still show source mapping correctly (hostel inclusive/addon/manual).
