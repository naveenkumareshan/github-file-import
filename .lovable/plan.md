

## Fix Stale Files on Published App

### Problem
When the app is published, users see old/cached files instead of the latest version. This is caused by the **Firebase service worker** (`firebase-messaging-sw.js`) caching old assets. The `index.html` script only unregisters service workers with `sw.js` in their URL, but `firebase-messaging-sw.js` slips through and continues serving stale content.

### Solution

**1. Update `index.html` to unregister ALL service workers**
Change the unregister script to remove every registered service worker, not just ones matching `sw.js`. This ensures `firebase-messaging-sw.js` and any other cached workers are cleaned up.

**2. Add cache-busting headers via `vite.config.ts`**
Add build output configuration so that generated assets have hashed filenames (Vite does this by default), and ensure `index.html` is not aggressively cached.

**3. Update `firebase-messaging-sw.js` to skip waiting and claim clients**
Add `self.skipWaiting()` and `self.clients.claim()` so that when a new version is deployed, the new service worker activates immediately instead of waiting.

### Files to Change

| File | Change |
|------|--------|
| `index.html` | Update service worker unregister script to match ALL service workers, not just `sw.js` |
| `public/firebase-messaging-sw.js` | Add `skipWaiting()` and `clients.claim()` to ensure new versions activate immediately |

### Technical Details

**index.html** - unregister all service workers:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(r) { r.unregister(); });
  });
}
```

**firebase-messaging-sw.js** - add at the top:
```javascript
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
```

This clears all cached assets on activation and ensures the new service worker takes over immediately.

### Expected Result
- After publishing, users will see the latest version without needing to manually clear their browser cache
- The Firebase service worker won't hold onto stale files
- Any previously cached assets are cleaned up on the next visit

