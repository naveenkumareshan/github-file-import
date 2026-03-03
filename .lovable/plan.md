

# Fix: Google OAuth 404 in Capacitor Native App

## Problem

The log shows: `404 Error: User attempted to access non-existent route: /~oauth/initiate`

The `lovable.auth.signInWithOAuth("google")` internally navigates to `/~oauth/initiate` — a server-side route that only exists on the Lovable platform. In a Capacitor build loading from local `dist/` files, this route does not exist, so the React Router catch-all renders a 404 page.

This is a fundamental incompatibility: the Lovable OAuth wrapper requires platform server routes that are unavailable in native builds.

## Solution

For Capacitor environments, bypass the Lovable OAuth wrapper and use `supabase.auth.signInWithOAuth` directly. This opens the Google consent screen in the system browser and redirects back to the published web URL, where the session tokens are captured.

For non-Capacitor (web) environments, continue using `lovable.auth.signInWithOAuth` as before.

## Changes

### `src/components/auth/SocialLoginButtons.tsx`

- Detect Capacitor via `window.Capacitor`
- **Capacitor path**: Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://inhalestays-com.lovable.app/student-login' } })`. This opens the system browser for Google login and redirects to the published URL after auth. The user will need to manually return to the app, where the session will be picked up by the `onAuthStateChange` listener in `AuthContext`.
- **Web path**: Keep using `lovable.auth.signInWithOAuth("google")` unchanged.

This is the only viable approach since the `/~oauth/*` routes are server-only and cannot be served from local files.

