

# Fix: Missing `qrcode` Package + QR Visibility

## Root Cause

The build fails because `qrcode` (the runtime library) is **not installed** — only `@types/qrcode` (the type definitions) exists in `package.json`. The actual `qrcode` package was never added as a dependency.

Additionally, QR buttons only appear on the **Manage Properties** page (`/partner/manage-properties`), not on admin routes like `/admin/rooms` where you're currently viewing. Admins viewing properties at `/admin/rooms` have no QR access.

## Fix

### 1. Add `qrcode` to `package.json` dependencies
Add `"qrcode": "^1.5.4"` to the dependencies section. This resolves the build error.

### 2. No other code changes needed
The QR generation logic in `ManageProperties.tsx` is already correctly implemented — it fetches properties via `getEffectiveOwnerId()`, shows QR buttons per property, and has the download dialog. The build failure was the only blocker preventing it from working.

### Where QR Download Lives
- Partners/employees access it at `/partner/manage-properties` — QR buttons appear in a horizontal scroll bar above the tabs, one per property.
- Admins don't currently have this page. If you want admins to also download QR codes, that would be a separate addition.

