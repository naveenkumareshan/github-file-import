

# Fix: Touch Long-Press Not Working in Native App

## Problems Found

1. **Stale closure in `handleBedCardClick`**: It uses `useCallback(() => { ... handleBedClick(bed) }, [])` with an empty dependency array. Since `handleBedClick` references state (hostels, selectedDate, etc.), it's captured as its initial version and never updates. Taps may open the sheet with wrong/stale data or fail entirely.

2. **Touch event + click race condition**: On mobile, `touchend` fires, then the browser synthesizes a `click` event ~300ms later. The `isLongPressRef` flag gets reset in `handleBedCardClick` on the first call, but if the synthetic click fires again, it can cause double-triggers or miss the flag.

3. **Context menu positioned using `clientX/clientY`** without accounting for scroll position or viewport bounds properly on mobile devices with smaller screens.

## Fixes

### File: `src/pages/admin/HostelBedMap.tsx`

1. **Fix stale closure** — Remove `useCallback` wrapper from `handleBedCardClick` or add `handleBedClick` to its dependency array. Since `handleBedClick` itself isn't memoized, simplest fix is to remove `useCallback` entirely from `handleBedCardClick`.

2. **Prevent synthetic click after long-press** — In `handleTouchEnd`, when `isLongPressRef.current` is true, call `e.preventDefault()` to suppress the subsequent synthetic `click` event. This is the standard way to prevent the tap-through issue on mobile.

3. **Improve context menu positioning** — Use `window.innerWidth` and `window.innerHeight` with better clamping and account for the safe area on mobile devices. Also use `touch.pageX/pageY` instead of `clientX/clientY` to handle scrolled content.

4. **Add haptic feedback hint** — Add a subtle visual scale animation on long-press start to give the user feedback that something is happening (CSS `touch-action: manipulation` on bed cards to disable double-tap zoom delay, speeding up taps).

### Summary of code changes:
- Remove `useCallback([])` from `handleBedCardClick` so it always uses current `handleBedClick`
- Add `e.preventDefault()` in `handleTouchEnd` when long-press was detected
- Add `touch-action: manipulation` CSS class to bed card elements
- Fix context menu positioning to use `pageX/pageY` with scroll-aware clamping

