

# Investigation: Share Links Not Opening

## Findings

I tested the share link routing thoroughly:

1. **Routes work correctly** — `/book-seat/IS-ROOM-2026-00001` loads "Scholar's Den" properly in the preview
2. **RLS allows public access** — The `cabins` table has a policy allowing anyone to view active+approved cabins
3. **Serial number lookup works** — `getCabinBySerialNumber` correctly queries the database
4. **Share URL generation is correct** — `generateCabinShareText` produces `https://inhalestays.com/book-seat/IS-ROOM-2026-XXXX`

## Root Cause

The share links point to `https://inhalestays.com`, your custom domain. The code is correct, but the **published version on your custom domain needs to be updated**. If the deployed version is behind the current codebase, the routes or serial number lookup may not work for visitors.

**Additionally**, there is one code issue: the share text passed to `navigator.share` already contains the URL (in the `🔗 https://...` line), and the `url` parameter is also passed separately. Some platforms concatenate both, which can produce a malformed link when students click it.

## Fix

### 1. Clean up ShareButton to avoid double-URL issue
In `src/components/ShareButton.tsx`, the `encoded` variable for WhatsApp/Telegram/Email concatenates `shareText + "\n" + url`, but `shareText` already includes the URL. This causes the URL to appear twice and sometimes malformed.

Fix: Use only the `url` prop separately, and strip the URL line from the display text when building platform-specific share links.

### 2. Ensure `navigator.share` doesn't double-encode
Pass a simplified `text` (without the URL line) to `navigator.share`, since the `url` field is passed separately and platforms append it automatically.

### 3. Update shareUtils to separate text and URL
Modify `generateCabinShareText` and `generateHostelShareText` to return the text body **without** the URL line, since the URL is already returned as a separate field.

### 4. Publish the app
After the code fix, you need to click **Publish → Update** to deploy the latest version to `inhalestays.com`.

## Files Changed
- `src/utils/shareUtils.ts` — Remove URL line from the text body (it's passed separately)
- `src/components/ShareButton.tsx` — Use `url` directly instead of appending it to text again

