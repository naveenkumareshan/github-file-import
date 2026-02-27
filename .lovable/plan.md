

## Fix Student Profile Image Upload

### Problems Found

1. **No file upload UI**: The Camera button on the avatar opens the "Account Info" sheet but there's no file input to actually pick and upload a profile picture.
2. **Missing storage bucket**: `userProfileService.uploadProfilePicture()` tries to upload to a `profiles` storage bucket, but that bucket doesn't exist. Only `banners` and `cabin-images` buckets are configured.
3. **No connection between upload and profile save**: Even if an image were uploaded, the profile picture URL isn't being set anywhere in the account section form.

### Fix Plan

#### 1. Create `profiles` storage bucket (database migration)

Create a public storage bucket called `profiles` with RLS policies allowing authenticated users to upload/manage their own avatar files.

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');
```

#### 2. Add profile picture upload UI in ProfileManagement.tsx

- Add a hidden file input triggered by the Camera button on the avatar
- On file selection, call `userProfileService.uploadProfilePicture(file)`
- On success, update the local `profile.profile_picture` state with the returned URL
- Show a loading spinner on the avatar while uploading

#### 3. Fix upload path in userProfileService.ts

Update `uploadProfilePicture` to use a path format that matches the RLS policy:
- Path: `{user.id}/avatar.{ext}` (so `foldername` returns the user ID)
- Add cache-busting timestamp to the public URL to avoid stale images

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `profiles` storage bucket + RLS policies |
| `src/components/profile/ProfileManagement.tsx` | Add hidden file input on Camera button, handle upload with loading state |
| `src/api/userProfileService.ts` | Fix upload path to `{userId}/avatar.{ext}` for RLS compatibility, add cache-busting |

