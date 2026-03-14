

# Fix QR Code Preview — Full Size & Clear Display

## Problem
The branded QR card (480×640px) is being forced into tiny square containers (`w-56 h-56` = 224px square, `w-48 h-48` = 192px square), which distorts the aspect ratio and makes the QR unreadable.

## Fix — 2 files, same pattern

### 1. `src/components/admin/operations/QrCodesTab.tsx` (line 81, 86)
- Dialog: change `sm:max-w-xs` → `sm:max-w-sm`
- Image: change `className="w-56 h-56"` → `className="w-full max-w-[320px] h-auto rounded-lg"`
  - This preserves the 480:640 aspect ratio and renders the full branded card clearly

### 2. `src/pages/partner/ManageProperties.tsx` (lines 264, 270)
- Dialog: change `sm:max-w-xs` → `sm:max-w-sm`
- Image: change `className="mx-auto w-48 h-48 rounded-lg border"` → `className="w-full max-w-[320px] h-auto rounded-lg"`
- Remove the redundant property name `<p>` and instruction `<p>` since the branded card already contains those
- Simplify the container from `text-center space-y-4` to `flex flex-col items-center gap-4` for consistency

Both dialogs will show the full branded card at ~320px wide with correct proportions, making the QR code large and scannable.

