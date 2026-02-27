

## Fix Terms Display and Duration Wording

### Issue 1: Terms Taking Too Much Space
The `ReadingRoomRules` component is rendered fully expanded inside the summary card, taking up excessive vertical space. Wrap it in a `Collapsible` component so the rules are hidden by default and only expand when clicked.

**File: `src/components/seats/SeatBookingForm.tsx` (lines 945-948)**
- Replace the direct `<ReadingRoomRules />` render with a `Collapsible` wrapper
- Add a `CollapsibleTrigger` button showing "Reading Room Rules" with a chevron icon
- Place `ReadingRoomRules` inside `CollapsibleContent` so it only shows when toggled
- Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from the existing UI component

### Issue 2: Duration Wording ("2 Dailys", "5 Weeklys")
On line 814, the duration label is constructed as:
```
{selectedDuration.count} {selectedDuration.type...}{selectedDuration.count > 1 ? 's' : ''}
```
This produces "2 Dailys" or "3 Weeklys" which is grammatically wrong.

**Fix**: Use proper pluralization:
- "daily" -> "1 Day" / "2 Days"
- "weekly" -> "1 Week" / "2 Weeks"  
- "monthly" -> "1 Month" / "2 Months"

Replace the inline logic with a helper that maps the duration type to proper singular/plural nouns.

### Files Modified

| File | Change |
|------|--------|
| `src/components/seats/SeatBookingForm.tsx` | Wrap ReadingRoomRules in Collapsible; fix duration label wording |

