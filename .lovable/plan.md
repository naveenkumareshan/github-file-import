
# Fix "invalid input syntax for type uuid" Error

## Problem
When saving a hostel (especially after editing food policy), the save sends empty strings `""` for UUID columns like `area_id`, `state_id`, `city_id`, and `created_by`. PostgreSQL rejects `""` as invalid UUID syntax.

This happens because `HostelEditor.tsx` initializes these fields as `''` (empty string) on lines 59-64 when no value exists. When the full hostel object is passed to `hostelService.updateHostel()`, these empty strings hit the database.

## Fix

### Update `src/api/hostelService.ts` -- Sanitize UUID fields before insert/update

Add a helper function that converts empty string values to `null` for known UUID columns before sending to the database:

```typescript
const UUID_FIELDS = ['state_id', 'city_id', 'area_id', 'created_by', 'vendor_id'];

function sanitizeUUIDs(data: Record<string, any>) {
  const cleaned = { ...data };
  for (const field of UUID_FIELDS) {
    if (cleaned[field] === '' || cleaned[field] === undefined) {
      cleaned[field] = null;
    }
  }
  return cleaned;
}
```

Apply this in both `createHostel` and `updateHostel` methods before passing data to Supabase.

### Files to modify
| File | Change |
|------|--------|
| `src/api/hostelService.ts` | Add UUID sanitizer helper, apply in `createHostel` and `updateHostel` |

This is a one-file, minimal fix that prevents empty strings from reaching UUID columns.
