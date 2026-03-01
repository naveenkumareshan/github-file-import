

## Fix Build Failure - VitePWA Workbox Serialization Error

### Root Cause
The Vite build completes all chunk generation successfully, but then the VitePWA plugin's workbox `generateSW` step fails. The `runtimeCaching` configuration on line 68 uses a JavaScript **function** for `urlPattern`:

```typescript
urlPattern: ({ url }) =>
  url.origin === 'https://inhalestays.com' &&
  url.pathname.startsWith('/manage/api'),
```

Workbox's `generateSW` strategy **cannot serialize JavaScript functions** into the generated service worker file. It only supports `RegExp` or `string` patterns. This causes the build to fail after chunks are rendered, but the error message gets truncated in the build log.

### Fix

**File: `vite.config.ts`** - Replace the function-based `urlPattern` with a RegExp pattern:

```typescript
runtimeCaching: [
  {
    urlPattern: /^https:\/\/inhalestays\.com\/manage\/api\/.*/,
    handler: 'NetworkOnly'
  }
]
```

This RegExp achieves the same filtering (matching URLs on `inhalestays.com` starting with `/manage/api/`) but can be properly serialized by workbox's `generateSW`.

### Additional Cleanup (same file)

- Remove `favicon.svg` from `includeAssets` since only `favicon.ico` exists in the `public/` directory (minor cleanup to avoid warnings)

### Files to Edit
| File | Change |
|------|--------|
| `vite.config.ts` | Replace function `urlPattern` with RegExp, fix `includeAssets` |

### Expected Result
The VitePWA workbox service worker generates successfully, the build passes, and the app publishes.

