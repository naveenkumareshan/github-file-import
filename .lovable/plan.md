

## Add Splash Screen and App Icon for Native App

The Capacitor setup from the previous step wasn't saved, so this plan includes the full Capacitor setup plus splash screen configuration.

### Step 1: Install Capacitor Dependencies

Add to `package.json`:
- `@capacitor/core`
- `@capacitor/cli` (dev dependency)
- `@capacitor/ios`
- `@capacitor/android`
- `@capacitor/splash-screen`

### Step 2: Create `capacitor.config.ts`

Configure Capacitor with:
- **appId**: `app.lovable.3eba92fb4507477d8b3685f58b7311e2`
- **appName**: `inhalestaysbynaveen`
- **webDir**: `dist`
- **Live reload server** pointing to the preview URL
- **Splash screen plugin config**:
  - `launchAutoHide`: false (so we control when to hide it)
  - `backgroundColor`: `#0f172a` (matches the app's dark theme)
  - `showSpinner`: true
  - `androidSpinnerStyle`: `large`
  - `splashFullScreen`: true
  - `splashImmersive`: true

### Step 3: Create Splash Screen Initialization

Create `src/utils/splashScreen.ts` that:
- Imports `SplashScreen` from `@capacitor/splash-screen`
- Checks if running on a native platform (`Capacitor.isNativePlatform()`)
- Hides the splash screen after the app mounts (with a short delay for smooth transition)

### Step 4: Integrate in `App.tsx`

Call the splash screen hide function in the main `App` component's `useEffect`.

### Step 5: User Instructions for Icons

After code changes, provide instructions for generating native splash screen and app icon assets:

1. Export to GitHub and clone the repo
2. Install dependencies with `npm install`
3. Add platforms: `npx cap add android` / `npx cap add ios`
4. Use the existing `public/pwa-512x512.png` as the base icon
5. Use `@capacitor/assets` tool to auto-generate all required splash screen and icon sizes:
   ```
   npx @capacitor/assets generate --iconBackgroundColor #0f172a --splashBackgroundColor #0f172a
   ```
6. Run `npm run build && npx cap sync`
7. Run `npx cap run android` or `npx cap run ios`

### Files to Create/Edit

| File | Action |
|------|--------|
| `package.json` | Add Capacitor + splash-screen dependencies |
| `capacitor.config.ts` | Create with app config + splash screen plugin settings |
| `src/utils/splashScreen.ts` | Create splash screen hide logic |
| `src/App.tsx` | Add splash screen initialization on mount |

