

## Create a Native Mobile App with Capacitor

Capacitor will wrap your existing web app into a native shell that can be published to the Apple App Store and Google Play Store.

### What I'll Do

1. **Install Capacitor dependencies** - Add `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, and `@capacitor/android` to your project.

2. **Initialize Capacitor** - Create the Capacitor configuration file with:
   - App ID: `app.lovable.3eba92fb4507477d8b3685f58b7311e2`
   - App Name: `inhalestaysbynaveen`
   - Live reload server pointing to your preview URL for development

### What You'll Need to Do After

Once I set things up in the code, you'll need to follow these steps on your computer:

1. **Export to GitHub** - Click your project name (top left) -> Settings -> GitHub tab -> Connect and transfer the project
2. **Clone and install** - Pull the project from GitHub and run `npm install`
3. **Add platforms**:
   - For Android: `npx cap add android`
   - For iPhone: `npx cap add ios`
4. **Build and sync**:
   - `npm run build`
   - `npx cap sync`
5. **Run the app**:
   - Android: `npx cap run android` (requires Android Studio)
   - iPhone: `npx cap run ios` (requires a Mac with Xcode)

### Requirements
- **For Android**: Install [Android Studio](https://developer.android.com/studio)
- **For iPhone**: You need a Mac with [Xcode](https://developer.apple.com/xcode/) installed

### Useful Resource
For a detailed walkthrough, check out this guide: [Building mobile apps with Lovable](https://docs.lovable.dev/tips-tricks/mobile-app)

