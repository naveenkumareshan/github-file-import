

## Fix: Remove Duplicate Collapsible Import

**Problem**: Line 16 and line 17 in `src/pages/vendor/VendorSeats.tsx` are identical imports:

```text
16 | import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
17 | import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
```

This causes the build error: "the name `Collapsible` is defined multiple times".

**Fix**: Delete line 17 (the duplicate). Keep only one import on line 16.

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Remove duplicate line 17 |

One-line fix, no other changes needed.

