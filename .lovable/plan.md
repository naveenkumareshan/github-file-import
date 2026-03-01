
## Fix VendorSeats.tsx Build Error

### Problem
Line 536 references `bookingPlan` and `customDays` which are undefined variables. The correct state variable is `selectedDuration` (with `.type` and `.count` properties).

### Fix
**File: `src/pages/vendor/VendorSeats.tsx` (line 536)**

Replace:
```typescript
duration: (bookingPlan as any) === 'monthly' ? '1 Month' : (bookingPlan as any) === '15days' ? '15 Days' : `${(customDays as any) || 0} Days`,
```

With:
```typescript
duration: selectedDuration.type === 'monthly' ? `${selectedDuration.count} Month${selectedDuration.count > 1 ? 's' : ''}` : selectedDuration.type === 'weekly' ? `${selectedDuration.count} Week${selectedDuration.count > 1 ? 's' : ''}` : `${selectedDuration.count} Day${selectedDuration.count > 1 ? 's' : ''}`,
```

This uses the existing `selectedDuration` state variable (defined at line 89) which has `type` ('daily'|'weekly'|'monthly') and `count` (number) -- matching the booking form's actual data.

### Files
| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Replace undefined vars with `selectedDuration` on line 536 |
