

## Fix Mobile Safe Areas for Native App

When running as a native app, content collides with the device's **status bar** (top notch/camera area) and the **bottom navigation bar** overlaps with the system's home indicator. This is fixed using CSS safe area insets.

---

### Changes

**1. `index.html` - Enable safe area insets**
- Update the viewport meta tag to include `viewport-fit=cover`:
  ```
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  ```
  This tells the browser to extend the app into the safe area zones so we can manually pad them.

**2. `src/index.css` - Add global safe area padding**
- Add CSS for the root element to respect safe areas:
  ```css
  #root {
    padding-top: env(safe-area-inset-top);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
  ```
  This prevents content from going under the top status bar/notch on all pages.

**3. `src/components/student/MobileAppLayout.tsx` - Safe area on main layout**
- Add `pt-[env(safe-area-inset-top)]` padding to the root container so content starts below the status bar.
- Update `pb-16` on the main content to also account for the bottom safe area.

**4. `src/components/student/MobileBottomNav.tsx` - Already handled**
- The bottom nav already uses `paddingBottom: 'env(safe-area-inset-bottom)'` -- this is correct and stays as-is.

**5. `src/components/AdminLayout.tsx` - Safe area for admin panel**
- Add top safe area padding to the admin layout header so it doesn't collide with the status bar on native devices.

**6. `capacitor.config.ts` - Status bar configuration**
- Add `StatusBar` plugin config to use an overlay-style status bar so the app fills the full screen with proper padding.

### Summary of Files

| File | Change |
|------|--------|
| `index.html` | Add `viewport-fit=cover` to viewport meta |
| `src/index.css` | Add safe area padding on `#root` |
| `src/components/student/MobileAppLayout.tsx` | Add top safe area padding |
| `src/components/AdminLayout.tsx` | Add top safe area padding to header |
| `capacitor.config.ts` | Add StatusBar plugin config |

