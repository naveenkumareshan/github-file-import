

## Fix Stale Pages on Published App

### Root Cause Analysis

The previous fix (unregistering service workers and clearing caches) is correct but insufficient because of a **circular dependency**:

1. The old `index.html` (without the fix) is itself cached by the browser
2. Firebase's `getToken()` call in `firebaseNotificationService.ts` **automatically re-registers** `firebase-messaging-sw.js` as a service worker after we unregister it
3. The PWA manifest (`manifest.webmanifest`) with `"display": "standalone"` tells browsers to aggressively cache the app shell

So the cycle is: old cached `index.html` loads -> old JS runs -> Firebase re-registers the service worker -> stale content persists.

### Solution (3 changes)

**1. Add no-cache meta tags to `index.html`**
Add HTTP-equiv cache control headers to prevent browsers from caching `index.html` itself:
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

**2. Also clear caches in `index.html` script**
Extend the existing script to also programmatically clear all browser caches (CacheStorage API), so even if the old `index.html` was cached, once the new one loads it wipes everything:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    regs.forEach(function(r) { r.unregister(); });
  });
}
if ('caches' in window) {
  caches.keys().then(function(keys) {
    keys.forEach(function(k) { caches.delete(k); });
  });
}
```

**3. Remove the PWA manifest link from `index.html`**
The `<link rel="manifest">` tag causes browsers to treat the app as a PWA and aggressively cache the app shell. Since the app isn't actually using PWA features (no service worker registration code, no offline support), remove this line to prevent browsers from caching old assets.

### Files to Change

| File | Change |
|------|--------|
| `index.html` | Add no-cache meta tags, add cache clearing script, remove manifest link |

### Expected Result
- Browsers will not aggressively cache `index.html`
- All existing caches are cleared on page load
- Service workers are unregistered and not re-cached
- Users see the latest version after publishing without manual cache clearing

