# 📋 Deployment Checklist — MapAi

## ✅ Pre-Deployment (Local Setup)

### Android Development
- [ ] Android Studio installed
- [ ] SDK 36 (or compatible) installed
- [ ] Gradle cache cleaned: `./gradlew clean`
- [ ] APK builds successfully: `./workflow.sh build`
- [ ] No compile errors in IDE

### Backend Setup
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed: `cd backend && npm install`
- [ ] Backend starts locally: `npm start`
- [ ] HTTP 200 from: `curl http://localhost:3000/api/health`

### Code Quality
- [ ] No warnings in Android build
- [ ] No errors in Kotlin/Java
- [ ] No TODO comments remaining
- [ ] Code follows conventions (see AGENTS.md)

---

## ✅ GitHub Account Setup

### Repository
- [ ] Repository created: `fevian448/Map-Ai`
- [ ] Repository is public (for GitHub Pages)
- [ ] `.gitignore` configured:
  ```
  ✓ local.properties
  ✓ *.keystore
  ✓ *.jks
  ✓ .idea/
  ✓ .gradle/
  ✓ build/
  ```
- [ ] README.md updated
- [ ] License added (MIT recommended)

### Initialization
- [ ] Repository cloned locally
- [ ] Initial commit made: `git commit -m "initial commit"`
- [ ] Pushed to master: `git push -u origin master`

---

## ✅ Developer Account Setup

### Google Account
- [ ] Account created: `fevianbenjo48@gmail.com`
- [ ] 2FA enabled on Google account
- [ ] Recovery phone/email verified

### Google Cloud Console
- [ ] Project created: "MapAi"
- [ ] Billing account linked (optional, can stay free)
- [ ] Maps SDK for Android enabled
- [ ] Directions API enabled (optional)
- [ ] Places API enabled (optional)

### Google Play Console
- [ ] Account created with same email
- [ ] Developer agreement accepted
- [ ] Payment method set (for later)
- [ ] Store listing created (draft)

---

## ✅ Keystore & Signing

### Generate Keystore
```bash
./config.sh generate-keystore
```
- [ ] `mapai-release.keystore` created
- [ ] Passwords saved in secure location
- [ ] Key alias confirmed: `mapai`

### Verify Keystore
```bash
keytool -list -v -keystore mapai-release.keystore
```
- [ ] Shows "mapai" entry
- [ ] SHA-1 fingerprint copied
- [ ] SHA-256 fingerprint copied

### Convert to Base64
```bash
base64 -w 0 mapai-release.keystore > keystore-base64.txt
```
- [ ] `keystore-base64.txt` created
- [ ] Base64 string copied (long string)

---

## ✅ Google Maps API

### API Key Generation
1. [ ] Go to Google Cloud Console
2. [ ] APIs & Services → Credentials
3. [ ] Create API Key
4. [ ] Restrict to Android
5. [ ] Add SHA-1 fingerprint from keystore
6. [ ] API key generated (looks like: `AIzaSy...`)

### Update Android App
File: `app/src/main/res/values/strings.xml`
```xml
<string name="google_maps_api_key">YOUR_KEY_HERE</string>
```
- [ ] API key added to strings.xml
- [ ] App builds with API key
- [ ] Maps displayed correctly (test locally)

### Local Testing
File: `local.properties`
```properties
GOOGLE_MAPS_API_KEY=YOUR_KEY
```
- [ ] Key added to local.properties
- [ ] App tested locally
- [ ] Maps work on device/emulator

---

## ✅ GitHub Secrets Configuration

### Run Setup Script
```bash
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh
```

Or manually add to: https://github.com/fevian448/Map-Ai/settings/secrets/actions

### Required Secrets
- [ ] `KEYSTORE_BASE64` = (base64 string from keystore)
- [ ] `KEYSTORE_PASSWORD` = (your keystore password)
- [ ] `KEY_PASSWORD` = (your key password)
- [ ] `KEY_ALIAS` = mapai

### Optional Secrets (for production)
- [ ] `GOOGLE_MAPS_API_KEY` = (your API key)
- [ ] `GOOGLE_PLAY_JSON` = (service account JSON in base64)

### Verify Secrets
```bash
gh secret list --repo fevian448/Map-Ai
```
- [ ] All secrets appear in list
- [ ] No values exposed

---

## ✅ GitHub Pages Configuration

### Enable Pages
1. [ ] Go to Settings → Pages
2. [ ] Source: GitHub Actions
3. [ ] Save
4. [ ] Wait 1-2 minutes

### Verify Deployment
1. [ ] Check Actions tab for `deploy-web.yml`
2. [ ] Workflow shows ✅ Complete
3. [ ] Visit: https://fevian448.github.io/Map-Ai/
4. [ ] Live map appears

---

## ✅ GitHub Actions Workflows

### Verify Workflows Exist
```
.github/workflows/
```
- [ ] `build-apk.yml` — Builds debug + release APK
- [ ] `build-signed-apk.yml` — Builds and signs for Play Store
- [ ] `deploy-web.yml` — Deploys GitHub Pages
- [ ] `deploy-backend-free.yml` — Backend deployment guide

### Test Workflows
1. [ ] Push to master: `git push origin master`
2. [ ] Check Actions tab
3. [ ] Wait for builds to complete
4. [ ] All workflows show ✅ Success
5. [ ] APKs in Releases
6. [ ] GitHub Pages updated

---

## ✅ Backend Deployment

### Choose Platform
- [ ] **Render** (recommended) — Free 750 hrs/month
- [ ] **Railway** — Free $5/month
- [ ] **Docker** — Self-hosted

### For Render.com
1. [ ] Account created at render.com
2. [ ] GitHub repo connected
3. [ ] Web Service created
4. [ ] Environment variables set
5. [ ] Backend deployed and live
6. [ ] Test health check: `curl https://mapai-xxx.onrender.com/api/health`

### For Railway
1. [ ] Account created at railway.app
2. [ ] GitHub repo connected
3. [ ] Project created
4. [ ] Environment variables set
5. [ ] Backend deployed and live

### Get Backend URL
- [ ] Backend URL noted: `https://your-backend-url.com`
- [ ] CORS enabled for Android app
- [ ] Health check passing

---

## ✅ Android App Configuration

### Update Backend URL
1. [ ] Open app on Android device/emulator
2. [ ] Settings → Server URL
3. [ ] Enter backend URL
4. [ ] Test connection (should show "Connected")

### Test Features
- [ ] Map loads correctly
- [ ] Real-time reports appear
- [ ] Can submit new report
- [ ] Location tracking works
- [ ] SOS button functional

---

## ✅ Final Checks

### Code Quality
- [ ] No hardcoded secrets
- [ ] No API keys in code
- [ ] No personal information exposed
- [ ] README up to date

### Security
- [ ] GitHub Secrets used, not hardcoded
- [ ] Keystore secured (not in git)
- [ ] local.properties in .gitignore
- [ ] No test accounts in production

### Documentation
- [ ] DEVELOPER_ACCOUNT.md complete
- [ ] GITHUB_QUICK_START.md linked
- [ ] FREE_DEPLOYMENT_GUIDE.md ready
- [ ] Comments in critical code

### Performance
- [ ] APK size reasonable (~50-100 MB)
- [ ] App cold start < 5 seconds
- [ ] Network requests < 2 seconds
- [ ] Database queries fast with indices

---

## ✅ Production Readiness

### Before First Release
- [ ] All workflows passing
- [ ] APK signed and ready
- [ ] Backend deployed and stable
- [ ] Maps API key restricted
- [ ] Error logging configured
- [ ] Rate limiting active

### Before Public Launch
- [ ] Beta testing completed
- [ ] User feedback incorporated
- [ ] Google Play listing complete
- [ ] Privacy policy created
- [ ] Support email set up
- [ ] Release notes written

---

## 🎉 Deployment Complete!

Once all boxes checked:

### Announce Release
```
✅ Version 1.0 Released
📱 Android APK: github.com/fevian448/Map-Ai/releases
🌐 Live Web: fevian448.github.io/Map-Ai/
🤖 Automated CI/CD: GitHub Actions
💰 100% Free: No ads, no paywalls
```

### Monitor Deployments
- [ ] Subscribe to workflow notifications
- [ ] Monitor Actions tab weekly
- [ ] Check GitHub Pages uptime
- [ ] Monitor backend logs

### Maintenance
- [ ] Review errors monthly
- [ ] Update dependencies quarterly
- [ ] Rotate API keys semi-annually
- [ ] Update documentation as features change

---

## 📝 Notes

**Developer Account:** `fevianbenjo48@gmail.com`
**Repository:** https://github.com/fevian448/Map-Ai
**Support:** See DOCUMENTATION.md for guides

**Last Updated:** 2026-07-19

---

**Status:** ✅ Ready for Deployment Phase

Once all items checked, proceed to:
1. Push to GitHub
2. Monitor Actions
3. Download APK from Releases
4. Test on Android device
5. Deploy backend
6. Announce release!
