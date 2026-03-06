

# Fix: Study Rooms Button Display in Bottom Nav

## Issue
The "Study Rooms" label in the bottom navigation wraps to two lines ("Study" / "Rooms") because the tab uses `flex-1` equal widths and the label is longer than the other single-word labels. This makes it look misaligned compared to Home, Hostels, Mess, and Profile.

## Fix

### `src/components/student/MobileBottomNav.tsx`
- Add `text-center whitespace-nowrap` to the label `<span>` to prevent wrapping
- Reduce label font size slightly for the longer label, or use `text-[10px]` globally to ensure all labels fit
- Add `overflow-hidden` on the inner container to prevent layout breakage

Alternatively, a simpler approach: add `whitespace-nowrap` to the label and slightly reduce the inner padding so the two-word label fits on one line.

### Files Modified
| File | Change |
|------|--------|
| `src/components/student/MobileBottomNav.tsx` | Add `whitespace-nowrap` to label span, adjust padding for fit |

