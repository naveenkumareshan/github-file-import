

## Fix Deployment: Remove VitePWA Plugin Causing Build Failure

### Root Cause Analysis

The build consistently completes all 3869 module transforms and chunk generation successfully, then **fails during the VitePWA plugin's post-build service worker generation step** (workbox `generateSW`). The actual error is truncated in the build log, but the failure always occurs after "computing gzip size..." -- exactly when VitePWA runs its `closeBundle` hook to generate the service worker.

The project already has a `firebase-messaging-sw.js` service worker in `public/`, creating a potential conflict with VitePWA's auto-generated service worker.

### Fix Strategy

**1. Remove VitePWA plugin from `vite.config.ts`**
- Strip out the entire `VitePWA(...)` plugin call and its configuration
- Keep the rest of the Vite config (aliases, build options, proxy, etc.)
- Remove the `import { VitePWA }` line

**2. Add a static `manifest.webmanifest` to `public/`**
- Move the PWA manifest from the VitePWA config into a standalone `public/manifest.webmanifest` file
- Add a `<link rel="manifest">` tag in `index.html` to reference it
- This preserves the "Add to Home Screen" / PWA install capability without needing the plugin

**3. Add service worker unregister script**
- Add a small inline script in `index.html` to unregister any previously cached VitePWA service workers
- This ensures users' browsers don't serve old cached builds
- The `firebase-messaging-sw.js` (for push notifications) remains unaffected

**4. Remove unused `src/routes.tsx`**
- This file creates a separate `createBrowserRouter` that is never used (App.tsx uses `<BrowserRouter>` with `<Routes>`)
- Removing dead code keeps the codebase clean

### Files to Change

| File | Change |
|------|--------|
| `vite.config.ts` | Remove VitePWA plugin import and configuration entirely |
| `public/manifest.webmanifest` | Create static PWA manifest (moved from VitePWA config) |
| `index.html` | Add manifest link + SW unregister script to clear old cache |
| `src/routes.tsx` | Delete unused file |

### Technical Details

**vite.config.ts** -- simplified to:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

**index.html** additions:
```html
<link rel="manifest" href="/manifest.webmanifest" />
<script>
  // Unregister old VitePWA service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => {
        if (r.active && r.active.scriptURL.includes('sw.js')) r.unregister();
      });
    });
  }
</script>
```

### What This Achieves
- Build will succeed (no more VitePWA generateSW failure)
- PWA install capability preserved via static manifest
- Old cached service workers cleared from users' browsers
- Firebase push notifications continue working via firebase-messaging-sw.js
- Clean production deployment with fresh build

