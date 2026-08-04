# GitHub Free Deployment Guide — MapAi

## 🎯 Overview

MapAi is fully hosted on free GitHub services:
- **Code & Version Control:** GitHub (free)
- **Web Live View:** GitHub Pages (free)
- **Android APK:** GitHub Releases (free)
- **CI/CD Automation:** GitHub Actions (free)
- **Backend Server:** Render / Railway / Docker (free tier available)

---

## 📖 Part 1: GitHub Pages (Web Live View)

### What is it?
GitHub Pages hosts static websites directly from your GitHub repository.

### How to Enable

1. **Go to Repository Settings**
   ```
   https://github.com/fevian448/Map-Ai/settings/pages
   ```

2. **Configure Source**
   - **Build and deployment** → **Source**
   - Select: **GitHub Actions**
   - Click **Save**

3. **Verify Deployment**
   - Check **Actions** tab: https://github.com/fevian448/Map-Ai/actions
   - Wait for `Deploy Live View to GitHub Pages` workflow to complete
   - Your site is live at:
     ```
     https://fevian448.github.io/Map-Ai/
     ```

### What's Deployed?
The live map viewer from `backend/public/index.html`
- Interactive Leaflet.js map
- Real-time Socket.IO updates
- No backend needed for static view

---

## 📦 Part 2: GitHub Releases (Android APK)

### What is it?
GitHub Releases store your app files with version history.

### How it Works

1. **Automatic Build & Upload**
   - Push to `master` branch
   - GitHub Actions builds APK
   - Automatically creates Release draft
   - Upload complete in 5-10 minutes

2. **Access APKs**
   ```
   https://github.com/fevian448/Map-Ai/releases
   ```

3. **Download APK**
   - Click latest Release
   - Download `app-release.apk` (for Google Play)
   - Download `app-debug.apk` (for testing)

### Installation on Phone
```bash
# Via ADB (for testing)
adb install -r app-debug.apk

# Via GitHub (for users)
1. Download APK from Releases
2. Open on Android phone
3. Tap to install
```

---

## 🚀 Part 3: Backend Server (Free Hosting)

### Option A: Render.com (Recommended)

**Free Tier:** 750 hours/month, good uptime

1. **Go to Render Dashboard**
   ```
   https://render.com
   ```

2. **Connect GitHub**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub account
   - Select repository: `Map-Ai`

3. **Configure Service**
   ```
   Name: mapai-backend
   Runtime: Node.js
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Plan: Free
   Region: Singapore / Asia Pacific
   ```

4. **Environment Variables**
   ```
   GOOGLE_MAPS_API_KEY=your_key_here
   LOG_LEVEL=info
   PORT=3000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render auto-deploys from `master` branch
   - Your backend is live at: `https://mapai-backend-XXXX.onrender.com`

### Option B: Railway

**Free Tier:** $5/month credit

1. **Go to Railway**
   ```
   https://railway.app
   ```

2. **Create Project**
   - "New Project" → "GitHub Repo"
   - Select `Map-Ai`

3. **Configure**
   - Service: Node.js
   - Auto-detects `backend/`
   - Sets PORT=3000 automatically

4. **Deploy**
   - Auto-deploys from `master`
   - Get URL from Service settings

### Option C: Docker (Self-Hosted)

For your own server:

```bash
# Build Docker image
docker build -t mapai-backend ./backend

# Run container
docker run -d \
  -p 3000:3000 \
  -v mapai-data:/app/data \
  -e GOOGLE_MAPS_API_KEY=YOUR_KEY \
  mapai-backend

# Access at: http://your-server:3000
```

---

## 🔧 Part 4: Configure Everything

### Step 1: Setup GitHub Secrets

```bash
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh
```

Or manually:
```
https://github.com/fevian448/Map-Ai/settings/secrets/actions
```

**Add Secrets:**
- `KEYSTORE_BASE64` — APK signing key
- `KEYSTORE_PASSWORD` — Keystore password
- `KEY_PASSWORD` — Key password
- `KEY_ALIAS` — Alias name
- `GOOGLE_MAPS_API_KEY` — Maps API key

### Step 2: Setup Android Keystore

```bash
./config.sh generate-keystore
```

Convert to Base64:
```bash
base64 -w 0 mapai-release.keystore > keystore-base64.txt
```

Add to GitHub Secret: `KEYSTORE_BASE64`

### Step 3: Setup Google Maps API

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com
   ```

2. **Create Project: MapAi**

3. **Enable APIs:**
   - Maps SDK for Android
   - Directions API
   - Places API

4. **Create API Key**
   - Restrict to Android
   - Add SHA-1 fingerprint (from debug.keystore)

5. **Add to GitHub:** `GOOGLE_MAPS_API_KEY`

### Step 4: Update Android App

File: `app/src/main/res/values/strings.xml`
```xml
<string name="google_maps_api_key">YOUR_API_KEY</string>
```

File: `local.properties` (for local testing)
```properties
GOOGLE_MAPS_API_KEY=YOUR_KEY
```

---

## ✅ Deployment Checklist

### GitHub Setup
- [ ] Repository: https://github.com/fevian448/Map-Ai
- [ ] Enable GitHub Pages (Settings → Pages)
- [ ] Add all GitHub Secrets
- [ ] Generate release keystore

### Workflows Created
- [ ] `build-apk.yml` — Builds Android APK
- [ ] `build-signed-apk.yml` — Builds & signs APK
- [ ] `deploy-web.yml` — Deploys GitHub Pages
- [ ] `deploy-backend-free.yml` — Backend deployment info

### Google Setup
- [ ] Google Cloud Project created
- [ ] Maps API enabled
- [ ] API Key generated
- [ ] SHA-1 fingerprint added

### First Deployment
- [ ] Push to `master` branch
- [ ] Watch Actions tab
- [ ] Verify GitHub Pages is live
- [ ] Verify APK in Releases
- [ ] Deploy backend (Render/Railway)
- [ ] Test Android app connection

---

## 📊 Free Tier Limits

| Service | Free Limit | Sufficient? |
|---------|-----------|-----------|
| GitHub Repos | Unlimited | ✅ Yes |
| GitHub Pages | 1 site per org | ✅ Yes |
| GitHub Actions | 2000 min/month | ✅ Yes (~500 per full build) |
| GitHub Releases | Unlimited storage | ✅ Yes |
| Render | 750 hours/month | ✅ Yes (~24/7 service) |
| Railway | $5/month | ✅ Yes (enough for small app) |

---

## 🔍 Monitor Deployments

### GitHub Actions

```
https://github.com/fevian448/Map-Ai/actions
```

**Workflows:**
- ✅ Build APK — ~5 min
- ✅ Deploy Web — ~2 min
- ✅ Tests — ~3 min

### GitHub Pages

```
https://github.com/fevian448/Map-Ai/settings/pages
```

Check:
- ✅ Build status
- ✅ Deployment URL
- ✅ Last deployed

### Backend

**Render Dashboard:**
```
https://dashboard.render.com
```

Check:
- ✅ Service status
- ✅ Logs
- ✅ Deployment history

---

## 🚨 Troubleshooting

### GitHub Pages returns 404

**Solution:**
1. Go to Settings → Pages
2. Ensure Source is "GitHub Actions"
3. Wait 5 minutes
4. Check Actions tab for errors

### APK build fails

**Solution:**
1. Check GitHub Secrets are all set
2. Verify keystore is valid: `keytool -list -v -keystore mapai-release.keystore`
3. View Actions logs for details

### Backend won't connect

**Solution:**
1. Verify backend is deployed (Render/Railway)
2. Get backend URL
3. In Android app Settings → Update "Server URL"
4. Check CORS settings in backend

---

## 📝 Next Steps

1. **First Time Setup**
   ```bash
   ./setup-github-secrets.sh
   git push origin master
   ```

2. **Monitor Builds**
   - Watch Actions tab
   - Verify all workflows pass

3. **Test Deployments**
   - Visit https://fevian448.github.io/Map-Ai/
   - Download APK from Releases
   - Connect Android app to backend

4. **Deploy Backend**
   - Choose Render or Railway
   - Connect GitHub repo
   - Auto-deploys on push

---

## 💡 Pro Tips

- ✅ **Keep main branch clean** — Only merge tested code
- ✅ **Tag releases** — Use GitHub Releases for version tracking
- ✅ **Monitor Actions** — Check failed builds immediately
- ✅ **Update secrets** — Rotate API keys every 6 months
- ✅ **Test locally first** — Run `./workflow.sh build` before push

---

## 📞 Support

- **Questions?** See [DEVELOPER_ACCOUNT.md](DEVELOPER_ACCOUNT.md)
- **Setup help?** See [SETUP.md](SETUP.md)
- **GitHub status?** https://www.githubstatus.com

**Account:** `fevianbenjo48@gmail.com`  
**Repository:** github.com/fevian448/Map-Ai

---

**Last Updated:** 2026-07-19  
**Status:** ✅ All Free Services Configured
