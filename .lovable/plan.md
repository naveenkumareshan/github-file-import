

# Add Camera Capture Option to All Photo Upload Components

## Problem
Currently, only `PaymentProofUpload.tsx` has `capture="environment"` for camera access. Other file upload components (ImageUpload, RefundManagement, CheckInUploadDialog, BannerManagement, VendorDocumentUpload, ProfileManagement, SiteSettingsForm) only support file picker — no direct camera option.

## Approach
For image-accepting upload inputs, provide **two buttons**: "Upload from Gallery" and "Capture Photo" — each triggering a separate hidden `<input>` (one without `capture`, one with `capture="environment"`). This gives users explicit choice on both mobile and desktop.

## Changes

### 1. `src/components/ImageUpload.tsx`
- Add a second hidden input with `capture="environment"`
- Add a second button "📷 Capture Photo" alongside the existing "Upload Image" button
- Both inputs share the same `handleUpload` handler

### 2. `src/components/admin/RefundManagement.tsx`
- Replace the single `<Input type="file">` with two buttons: "Upload" and "Capture"
- Add a hidden camera input with `capture="environment"` alongside the existing file input

### 3. `src/components/admin/operations/CheckInUploadDialog.tsx`
- Add a "Capture Photo" button alongside the existing file input
- Add a second hidden input with `capture="environment"` and `accept="image/*"`

### 4. `src/components/admin/BannerManagement.tsx`
- Add camera capture option alongside existing upload

### 5. `src/components/vendor/VendorDocumentUpload.tsx`
- Add camera capture button for image document types

### 6. `src/components/profile/ProfileManagement.tsx`
- Add camera capture option for profile photo upload

### 7. `src/components/admin/SiteSettingsForm.tsx`
- Add camera capture option for logo upload

### Technical Detail
Each component gets a pattern like:
```tsx
<div className="flex gap-2">
  <Button onClick={() => fileRef.current?.click()}>
    <Upload /> Upload
  </Button>
  <Button onClick={() => cameraRef.current?.click()}>
    <Camera /> Capture
  </Button>
</div>
<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handler} />
<input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handler} />
```

Both inputs reuse the same upload handler. The `capture="environment"` attribute opens the device camera directly on mobile devices.

