

# Fix: Restore Auth + Splash Timers

## Problem
1. **Infinite loading**: Removing `setTimeout` from `onAuthStateChange` caused a Supabase deadlock. The callback holds an internal lock, and `buildUser` calls `supabase.from('user_roles')` inside it — this hangs forever, so `isLoading` never becomes `false`.
2. **Splash too fast**: User wants original splash timing restored.

## Fix

### 1. `src/contexts/AuthContext.tsx` — Restore setTimeout in onAuthStateChange
Wrap the `buildUser` call back in `setTimeout(() => { ... }, 0)` to break out of Supabase's internal lock before making DB queries. This is the critical fix for the infinite loading.

### 2. `src/components/SplashOverlay.tsx` — Restore original timers
Change timers back to 1500ms (start fade) and 2100ms (remove), matching the original values.

