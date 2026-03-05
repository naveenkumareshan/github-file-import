

# Move Date Filter Inline with Property Selector

Currently the `DateFilterSelector` sits on its own row below the header. The user wants it moved to the same line as "All Properties", creating a single compact filter bar.

## Change in `src/pages/partner/BusinessPerformance.tsx`

Move the `<DateFilterSelector>` from its standalone position (lines 159-166) into the header's right-side flex container (line 146), right after the property selector. Remove the standalone usage.

**Before (simplified):**
```
Header row:  [Title]  ................  [All Properties]
Row 2:       [Date Filter]
```

**After:**
```
Header row:  [Title]  ......  [All Properties] [Date Filter]
```

### Implementation
1. Remove lines 159-166 (the standalone `<DateFilterSelector>`)
2. Insert the `<DateFilterSelector>` inside the `<div className="flex items-center gap-2 flex-wrap">` block (line 146), after the property `<Select>`

Single file: `src/pages/partner/BusinessPerformance.tsx`

