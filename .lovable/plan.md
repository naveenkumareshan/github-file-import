

## Fix Build Failure for Publishing

### Problem
The Vite build completes successfully (3869 modules transformed, all chunks generated), but the Lovable build system reports "failed to build." Since the build output is truncated, the actual error message at the end is hidden. The most likely cause is that **Vite outputs a warning about large chunk sizes** (chunks exceeding 500 kB after minification) to stderr, and the build system interprets this as a build failure.

### Fix Strategy
Two changes to resolve this:

**1. Add `chunkSizeWarningLimit` to suppress the Vite warning**
In `vite.config.ts`, add a `build` section that increases the chunk size warning limit so Vite doesn't output warnings to stderr:

```typescript
build: {
  chunkSizeWarningLimit: 2000, // 2MB limit to suppress warnings
}
```

**2. Remove `mode: mode` redundancy**
The explicit `mode: mode` in the config overrides Vite's default mode handling and could cause the production build to use the wrong mode. Remove line 20.

**3. Clean up `from('reviews' as any)` (optional improvement)**
Since `reviews` table now exists in the auto-generated types, remove the unnecessary `as any` casts from `reviewsService.ts`. While this won't fix the build (Vite doesn't type-check), it's good cleanup.

### Files to Edit
| File | Change |
|------|--------|
| `vite.config.ts` | Add `build.chunkSizeWarningLimit`, remove `mode: mode` |
| `src/api/reviewsService.ts` | Remove `as any` from `from('reviews')` calls (cleanup) |

### Expected Result
The Vite build warning is suppressed, the build completes without stderr output, and the app publishes successfully.
