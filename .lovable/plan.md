

# Fix: Bottom Nav Tabs Overlapping

## Issue
The 5 tabs with `flex-1` equal widths and `px-3` padding cause the active tab's `bg-primary/10` background pill to overlap adjacent tabs, especially "Study Rooms" which has a longer label. The `whitespace-nowrap` prevents wrapping but the content overflows into neighboring tabs.

## Fix

### `src/components/student/MobileBottomNav.tsx`
- Reduce inner padding from `px-3` to `px-1.5` so the active background pill stays within bounds
- Reduce icon size from `w-6 h-6` to `w-5 h-5` to give more breathing room
- Reduce `min-h` from `64px` to `56px` for a more compact nav
- Use `text-[9px]` for labels to ensure "Study Rooms" fits without overlapping

| File | Change |
|------|--------|
| `src/components/student/MobileBottomNav.tsx` | Reduce padding, icon size, and font size to prevent overlap |

