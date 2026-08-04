# Developer Account Setup — MapAi

## 📋 Developer Account Details

**Primary Developer Account:** `fevianbenjo48@gmail.com`

This account is used for:
- ✅ Google Play Console (Android app distribution)
- ✅ Google Cloud Console (APIs, Firebase, etc.)
- ✅ GitHub Developer Account
- ✅ Google Maps API
- ✅ All Google Services related to MapAi

---

## 🔐 Account Credentials Storage

### GitHub Secrets (Encrypted)

Store sensitive credentials in GitHub Repository Secrets:
https://github.com/fevian448/Map-Ai/settings/secrets/actions

**Required Secrets:**

| Secret Name | Description | How to Generate |
|-------------|-------------|-----------------|
| `KEYSTORE_BASE64` | Base64-encoded release keystore | See "Generate Keystore" below |
| `KEYSTORE_PASSWORD` | Keystore password | Securely saved in password manager |
| `KEY_PASSWORD` | Key alias password | Securely saved in password manager |
| `KEY_ALIAS` | Key alias name | Usually "mapai" |
| `GOOGLE_PLAY_JSON` | Google Play Service Account JSON | See "Google Play Setup" |
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key | From Google Cloud Console |

### Local Development

**DO NOT commit:**
- `local.properties` — Contains sensitive API keys
- `*.keystore` — Contains signing keys
- `*.json` — Service account files

---

## 🔑 Generate Keystore for APK Signing

### Step 1: Run Config Script

```bash
./config.sh generate-keystore
```

This creates: `mapai-release.keystore`

### Step 2: Convert to Base64 (for GitHub)

```bash
base64 -w 0 mapai-release.keystore > keystore-base64.txt
```

Copy the content of `keystore-base64.txt` to GitHub Secret: `KEYSTORE_BASE64`

### Step 3: Store Passwords Securely

Save to password manager or secure location:
- Keystore password
- Key password
- Key alias (usually "mapai")

Add to GitHub Secrets:
- `KEYSTORE_PASSWORD` = your keystore password
- `KEY_PASSWORD` = your key password  
- `KEY_ALIAS` = "mapai"

---

## 🎮 Google Play Console Setup

### Step 1: Go to Google Play Console

https://play.google.com/console

**Account:** `fevianbenjo48@gmail.com`

### Step 2: Create App

1. Click "Create app"
2. App name: **MapAi**
3. App category: **Navigation**
4. Type: **Android**

### Step 3: Generate Service Account Key

1. Go to **Settings** → **API & services**
2. Create new Service Account
3. Download as JSON
4. Encode to Base64:

```bash
base64 -w 0 service-account-key.json > play-service-account-base64.txt
```

5. Add to GitHub Secret: `GOOGLE_PLAY_JSON`

### Step 4: Manage Testers

Add email to **Internal Testing** track for UAT before Play Store release.

---

## 🗺️ Google Maps API Setup

### Step 1: Go to Google Cloud Console

https://console.cloud.google.com

**Account:** `fevianbenjo48@gmail.com`

### Step 2: Create Project

- Project name: **MapAi**
- Billing account: Link credit card

### Step 3: Enable APIs

Enable these APIs:
- ✅ Maps SDK for Android
- ✅ Directions API
- ✅ Places API
- ✅ Geocoding API

### Step 4: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Create API Key
3. Restrict to:
   - **Android apps**
   - SHA-1 fingerprint (see below)

### Step 5: Get SHA-1 Fingerprint

```bash
# For debug keystore (development)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep "SHA-1"

# For release keystore
keytool -list -v -keystore mapai-release.keystore -alias mapai | grep "SHA-1"
```

### Step 6: Add to GitHub Secrets

```bash
GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE"
```

### Step 7: Update Android Code

File: `app/src/main/AndroidManifest.xml`

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="@string/google_maps_api_key" />
```

File: `app/src/main/res/values/strings.xml`

```xml
<string name="google_maps_api_key">YOUR_API_KEY</string>
```

---

## 🐙 GitHub Setup

### Step 1: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. **Source:** GitHub Actions
3. **Branch:** Auto-deploy from workflow

### Step 2: Verify Workflows

Check Actions:
- ✅ `deploy-web.yml` — Deploys web live view
- ✅ `build-apk.yml` — Builds Android APK

### Step 3: Configure Secrets

Add all secrets from section above:
- KEYSTORE_BASE64
- KEYSTORE_PASSWORD
- KEY_PASSWORD
- KEY_ALIAS
- GOOGLE_PLAY_JSON
- GOOGLE_MAPS_API_KEY

---

## 📦 Android App Configuration

### File: `local.properties`

```properties
sdk.dir=/home/user/Android/Sdk
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

### File: `app/build.gradle.kts`

Already configured to read from `local.properties` and GitHub Secrets:

```kotlin
buildConfigField("String", "GOOGLE_MAPS_API_KEY", "\"${project.findProperty("GOOGLE_MAPS_API_KEY") ?: ""}\"")
```

### File: `gradle.properties`

For release build signing:

```properties
android.injected.signing.store.file=./mapai-release.keystore
android.injected.signing.store.password=KEYSTORE_PASSWORD
android.injected.signing.key.alias=KEY_ALIAS
android.injected.signing.key.password=KEY_PASSWORD
```

---

## 🚀 Deployment Workflow

### For Web Live View (Free via GitHub Pages)

1. Push to `master` branch with changes to `backend/public/`
2. GitHub Actions automatically deploys to:
   ```
   https://fevian448.github.io/Map-Ai/
   ```

### For Android APK

1. Push to `master` branch with changes to `app/`
2. GitHub Actions automatically:
   - ✅ Builds debug APK
   - ✅ Builds release APK (signed)
   - ✅ Creates Release draft on GitHub
   - ✅ Uploads APK artifacts (30 days retention)

3. Download from **Releases** tab:
   ```
   https://github.com/fevian448/Map-Ai/releases/latest
   ```

### For Google Play Console (Manual)

1. Download signed APK from GitHub Release
2. Upload to Google Play Console:
   - **Internal Testing** track first (30 testers)
   - **Closed Testing** track (limit testers)
   - **Open Testing** track (public beta)
   - **Production** (full release)

---

## 🔒 Security Best Practices

### ✅ DO

- ✅ Store secrets in GitHub Secrets, NOT in code
- ✅ Use separate keystores for debug and release
- ✅ Rotate API keys every 6 months
- ✅ Review GitHub security settings monthly
- ✅ Use 2FA on all developer accounts

### ❌ DON'T

- ❌ Never commit `local.properties`
- ❌ Never commit keystores or certificates
- ❌ Never hardcode API keys in source code
- ❌ Never share GitHub Secrets
- ❌ Never use personal API keys for production

---

## 📝 Checklist — First-Time Setup

- [ ] Create Google account: `fevianbenjo48@gmail.com`
- [ ] Enable 2FA on Google account
- [ ] Create Google Cloud Project
- [ ] Enable Maps API
- [ ] Generate Maps API Key
- [ ] Create Google Play Console app
- [ ] Create Service Account
- [ ] Generate Release Keystore (`./config.sh generate-keystore`)
- [ ] Convert keystore to Base64
- [ ] Add all GitHub Secrets
- [ ] Update `local.properties` with API key
- [ ] Test build: `./workflow.sh build`
- [ ] Test APK signing in CI/CD
- [ ] Push to GitHub and verify Actions
- [ ] Check GitHub Pages deployment
- [ ] Verify APK in Releases

---

## 📞 Support

For questions about setup, see:
- [SETUP.md](../SETUP.md) — Quick start guide
- [DEPLOY.md](../DEPLOY.md) — Deployment guide
- [CONFIG.md](../CONFIG.md) — Configuration reference

**Account Owner:** `fevianbenjo48@gmail.com`

---

**Last Updated:** 2026-07-19  
**Status:** Ready for Development & Testing
