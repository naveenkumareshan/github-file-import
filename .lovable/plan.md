

# Android and iOS App Preparation -- Readiness Check

## Current Status: Almost Ready

Your project already has Capacitor set up correctly:
- Capacitor config (`capacitor.config.ts`) is properly configured with appId, appName, splash screen, and live-reload server URL
- All required Capacitor packages are installed (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/splash-screen`)
- Splash screen utility (`src/utils/splashScreen.ts`) is implemented and called in `App.tsx`
- Mobile bottom navigation and layout are in place
- `viewport-fit=cover` meta tag is set for safe area support
- Safe area padding is applied in `MobileBottomNav` and `MobileAppLayout`

## What Needs To Be Done (Code-Side)

### 1. Move `@capacitor/cli` to devDependencies
Currently `@capacitor/cli` is in `dependencies` instead of `devDependencies`. This bloats the production bundle unnecessarily. It should be moved to `devDependencies`.

### 2. Add a `cap:sync` convenience script to `package.json`
Add helper npm scripts for easier native builds:
```json
"cap:sync": "npx cap sync",
"cap:android": "npx cap run android",
"cap:ios": "npx cap run ios"
```

## Steps You Need To Do On Your Machine

After I make the code changes above, here is what you need to do locally:

1. **Export to GitHub** -- Click the "Export to GitHub" button in Lovable to push your code to your own repository

2. **Clone and install** -- On your local machine:
   ```bash
   git clone <your-repo-url>
   cd <your-project>
   npm install
   ```

3. **Add native platforms**:
   ```bash
   npx cap add android
   npx cap add ios
   ```

4. **Build and sync**:
   ```bash
   npm run build
   npx cap sync
   ```

5. **Run on device/emulator**:
   - **Android**: Open Android Studio, then run `npx cap run android`
   - **iOS** (Mac only): Open Xcode, then run `npx cap run ios`

### Requirements
- **Android**: Android Studio installed with SDK 33+
- **iOS**: Mac with Xcode 15+ installed
- For publishing to stores, you will need an Apple Developer account ($99/year) and a Google Play Developer account ($25 one-time)

## Important Notes
- The app currently uses **live-reload mode** (loading from your Lovable preview URL). This is great for development. For a production release, you would comment out the `server.url` in `capacitor.config.ts` so the app loads from the built `dist` folder instead.
- Every time you make changes in Lovable, just run `npx cap sync` locally to update the native app.

For a detailed walkthrough, check out the Lovable blog post on building native apps with Capacitor: [https://docs.lovable.dev/tips-tricks/native-mobile-apps](https://docs.lovable.dev/tips-tricks/native-mobile-apps)

