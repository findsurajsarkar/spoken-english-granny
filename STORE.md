# Publishing Spoken English Granny on every platform

Live web app: **https://findsurajsarkar.github.io/spoken-english-granny/**

Granny is a Progressive Web App (PWA): one codebase that installs like a normal app on Android,
iPhone, Windows, Mac and Chromebook. Store versions are thin wrappers around the same live site,
so every update you push to GitHub reaches every platform automatically. No rebuilds are needed
unless you change the icon or name.

| Platform | Available today (free) | Store version | Store cost |
|---|---|---|---|
| Android | Chrome → "Install app" | Google Play (Trusted Web Activity) | $25 one-time |
| Android (sideload) | Direct `.apk` download from your website | — | free |
| iPhone / iPad | Safari → Share → "Add to Home Screen" | App Store (see warnings) | $99 / year |
| Windows | Chrome/Edge → install icon in the address bar | Microsoft Store (MSIX) | free for individuals |
| Mac | Chrome → install icon, or Safari → File → Add to Dock | Mac App Store (not recommended yet) | $99 / year |

All store packages are generated from the live URL with **PWABuilder** (free, by Microsoft):
https://www.pwabuilder.com

---

## 1. Android: Google Play

1. Create a Google Play developer account: https://play.google.com/console (one-time US$25, ID verification).
2. Go to https://www.pwabuilder.com, enter the live URL, then **Package for stores → Android → Google Play**.
   - Package ID: `com.spokenenglishgranny.app` (can never be changed later)
   - App name: `Spoken English Granny`, short name: `Granny`
   - **Start URL: `/spoken-english-granny/?app=play#/practice`**. The `?app=play` hides the Razorpay
     purchase buttons inside the Play app, because Google requires Play Billing for digital upgrades.
   - Signing key: let PWABuilder create a new one. **Download it and keep it forever, with a backup.**
     You can never update the app without it.
3. The download contains:
   - `app-release-bundle.aab`: upload this to Play Console.
   - `app-release-signed.apk`: for direct download (section 2) and testing on your own phone.
   - `assetlinks.json`: proves you own the website (next step).
4. **Digital Asset Links** (removes the browser address bar inside the app): the file must be served at
   `https://<your-domain>/.well-known/assetlinks.json`, the **root** of the domain. A GitHub Pages
   *project* site can't serve that path. Either:
   - buy a domain (e.g. `spokenenglishgranny.in`, ~₹800/year), point it to GitHub Pages
     (repo → Settings → Pages → Custom domain), put the file in `public/.well-known/assetlinks.json`,
     and re-package with the new URL (recommended); or
   - create a repo named `findsurajsarkar.github.io` and put the file there under `.well-known/`.
   Without it the app still works, but shows a small URL bar at the top.
5. In Play Console:
   - Create the app → **Education** category, free app. Mention the optional in-app upgrade in the listing.
   - Store listing: copy from `MARKETING.md`. Screenshots: take 4–8 phone screenshots (see MARKETING.md).
   - Privacy policy URL: `https://findsurajsarkar.github.io/spoken-english-granny/#/privacy`
   - Data safety: collects user ID (Puter username), app activity (practice text), not shared or sold;
     audio is processed for transcription only and not stored.
   - Content rating questionnaire: educational, no violence etc. (target: Everyone).
   - Start with **Internal testing** (up to 100 testers by email), then **Closed testing**. New personal
     developer accounts must run a closed test with at least 12 testers for 14 days before going public.

**Microphone:** Play-wrapped PWAs run in real Chrome, so the mic, live transcription and Google sign-in
all work exactly like the website.

## 2. Android: direct download from your website (no Play Store)

Upload `app-release-signed.apk` from step 1.3 to a GitHub Release:

```bash
gh release create v1.0.0 app-release-signed.apk --title "Spoken English Granny 1.0" --notes "Android app"
```

Then set `STORE_LINKS.playStore` in `src/config.ts` to the release download link (or add a separate
"Download APK" button). Users must allow "Install unknown apps", so the Play Store is better for
most people. Use the APK for testers.

## 3. Windows: Microsoft Store

1. Register as an individual developer at https://storedeveloper.microsoft.com (free for individuals).
2. PWABuilder → **Windows** → package with Start URL `/spoken-english-granny/?app=msstore#/practice`.
3. Upload the `.msixbundle` in Partner Center, using the same listing text and privacy URL.
   The Microsoft Store allows your own payment provider (Razorpay) for apps, so Plus stays for sale there.

Without the store, Windows users can already click **Install** in Chrome/Edge. That gives a Start menu
icon and its own window.

## 4. iPhone / iPad: App Store (read the warnings first)

What works today with no store: Safari → Share → **Add to Home Screen**. That gives a full-screen app
with an icon. **Recommend this to iPhone users for now.**

To publish on the App Store:
1. Apple Developer Program: https://developer.apple.com/programs ($99/year).
2. PWABuilder → **iOS** → download the Xcode project; start URL `/spoken-english-granny/?app=ios#/practice`.
3. Open it in Xcode on your Mac, set your team, add `NSMicrophoneUsageDescription`
   ("Granny listens so she can check your spoken English."), archive, and upload via Xcode.

⚠️ Known problems to fix **before** submitting:
- **Google sign-in inside an iOS app wrapper is blocked by Google** ("disallowed_useragent"). Sign-in must
  open in Safari/ASWebAuthenticationSession. This needs our own login system (the Supabase step) or a
  native change in the Xcode project.
- iOS web views have no live speech recognition, so the app uses the "record, then transcribe" path.
  That works, but you should test it.
- Apple rejects apps that are "just a website" (guideline 4.2). Granny has real app features, but
  expect questions from review.
- Plus can't be sold through Razorpay in the iOS app. It needs Apple In-App Purchase (15–30% fee).
  The `?app=ios` start URL already hides the Razorpay buttons.

## 5. Mac

Mac users can already install it: Chrome → install icon in the address bar, or Safari (macOS 14+) →
File → **Add to Dock**. A Mac App Store version has the same requirements and warnings as iOS, so skip it for now.

---

## Updating the app

Push to `main` → GitHub Actions rebuilds and deploys (about 1 minute) → every installed app and store
version shows the new version the next time it opens. You only re-upload to stores when you change the
name, icon, package settings or permissions.

## Before selling in stores: checklist

- [ ] `src/config.ts`: set the support `email` (Contact, Privacy, Refund pages and store listings need it)
- [ ] Custom domain + `assetlinks.json` (Android)
- [ ] Razorpay account live + `VITE_RAZORPAY_KEY_ID` repo secret + server-side payment check
- [ ] Real accounts and a server-side membership check (Supabase step) before charging real money
- [ ] Screenshots and a feature graphic for the store listing (MARKETING.md)
