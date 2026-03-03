

# Fix Capacitor App ID and App Name

The current `appId` in `capacitor.config.ts` uses an invalid format with a UUID containing digits at segment starts. Capacitor requires Java package format (e.g., `com.example.app`) where each segment starts with a letter.

## Changes to `capacitor.config.ts`

- Change `appId` from `app.lovable.3eba92fb4507477d8b3685f58b7311e2` to `com.inhalestays.app`
- Change `appName` from `inhalestaysbynaveen` to `InhaleStays`

## After the fix

Once updated, export to GitHub, pull locally, and run:
```bash
npx cap add android
npx cap add ios
npm run build
npx cap sync
npx cap open android   # or npx cap open ios
```

