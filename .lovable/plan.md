

## Plan: Fix Splash Screen Timing

### Problem
The splash screen disappears after a fixed 800ms (cached) or 1500ms (fresh), regardless of whether the app content has actually loaded. After the splash fades out, users see skeleton loaders and loading spinners while data is still being fetched — making the app feel slow because the "real" loading is exposed.

### Solution
Make the splash screen stay visible until the app is actually ready (auth resolved + initial route rendered), with a minimum display time for branding.

### Implementation

**1. Add a global "app ready" signal**
- Create a simple context/ref (`AppReadyContext`) that the splash listens to.
- `AuthProvider` already resolves the user session — once auth is resolved (not loading), signal "ready".

**2. Update `SplashOverlay.tsx`**
- Accept an `isReady` prop or consume the ready context.
- Show splash for at least 800ms AND until `isReady` is true (whichever is later).
- Cap maximum wait at 4 seconds (failsafe so splash never gets stuck).
- Keep the same fade-out animation (0.4s).

**3. Move `SplashOverlay` inside `AuthProvider` in `App.tsx`**
- Currently it's outside `AuthProvider`, so it can't know when auth resolves.
- Move it inside so it can consume auth loading state.
- Pass `isLoading` from `useAuth()` to determine readiness.

**4. Update `LazyWrapper` fallback**
- While splash is visible, the `LazyWrapper` skeleton fallback is hidden behind it anyway, so no visual change needed.

### Files to modify
- `src/components/SplashOverlay.tsx` — accept ready signal, wait for it before fading
- `src/App.tsx` — move SplashOverlay inside AuthProvider, pass auth loading state

