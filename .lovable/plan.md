

## Fix: Missing RLS Policy for Student Access to Laundry Partners

### Root Cause
The `laundry_partners` table has RLS enabled but only allows:
- Admins (full access)
- Partners (own record only)

There is **no SELECT policy for students/authenticated users** to view active laundry partners. The `getActivePartners()` query filters by `is_active = true` and `status = 'active'`, but RLS blocks the rows entirely for students.

### Fix — Database Migration

Add a SELECT policy allowing all authenticated users to view active, approved, student-visible partners:

```sql
CREATE POLICY "Students can view active laundry partners"
  ON public.laundry_partners
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND status = 'active'
    AND is_student_visible = true
  );
```

This matches the pattern used for `cabins`, `hostels`, and `mess_partners` where students can browse active listings.

### Files
| File | Action |
|------|--------|
| Database migration | Add student SELECT policy on `laundry_partners` |

No code changes needed — the queries are correct, they just need RLS to allow the read.

