

## Remove Visible Scrollbar from Student Pages

### Problem
The custom scrollbar styling in `src/index.css` (`::-webkit-scrollbar` rules) creates a visible scrollbar track and thumb on the right side of every page. On mobile student pages, this looks out of place and is unnecessary since mobile users scroll by touch.

### Fix

**File: `src/components/student/MobileAppLayout.tsx`**

Add a CSS class to the layout wrapper that hides scrollbars on all student pages:

- Add a `no-scrollbar` (or `scrollbar-hide`) class to the outer `<div>` so that the main content area hides the scrollbar while still allowing normal scroll behavior.

**File: `src/index.css`**

Add a utility class that hides scrollbars across browsers:

```css
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

Then apply this class in `MobileAppLayout` on the root wrapper and/or the `<main>` element so all student routes inherit hidden scrollbars.

### Technical Details

| File | Change |
|------|--------|
| `src/index.css` | Add `.no-scrollbar` utility class to hide scrollbars |
| `src/components/student/MobileAppLayout.tsx` | Apply `no-scrollbar` class to the root div and main element |

### Result
All student-facing pages will scroll normally via touch but will no longer show a visible scrollbar track on the right side. Admin pages remain unaffected.
