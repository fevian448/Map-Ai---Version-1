# Quick Start — GitHub Free Deployment

## ⚡ 5-Minute Setup

### 1. Generate Keystore
```bash
./config.sh generate-keystore
```

### 2. Setup GitHub Secrets
```bash
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh
```

Or manually add to GitHub: https://github.com/fevian448/Map-Ai/settings/secrets/actions
- `KEYSTORE_BASE64` (run: `base64 -w 0 mapai-release.keystore`)
- `KEYSTORE_PASSWORD`
- `KEY_PASSWORD`
- `KEY_ALIAS`

### 3. Enable GitHub Pages
Go to: https://github.com/fevian448/Map-Ai/settings/pages
- Source: GitHub Actions
- Save

### 4. Push to GitHub
```bash
git push -u origin master
```

### 5. Watch Actions
https://github.com/fevian448/Map-Ai/actions

✅ Done! Your app is now:
- 📱 Building: APK in Releases
- 🌐 Live: https://fevian448.github.io/Map-Ai/
- 🤖 Automated: CI/CD on every push

---

## 📍 Links

| What | URL |
|-----|-----|
| **Repository** | https://github.com/fevian448/Map-Ai |
| **Live Web View** | https://fevian448.github.io/Map-Ai/ |
| **Releases (APK)** | https://github.com/fevian448/Map-Ai/releases |
| **Actions (CI/CD)** | https://github.com/fevian448/Map-Ai/actions |
| **Secrets Config** | https://github.com/fevian448/Map-Ai/settings/secrets/actions |
| **Pages Settings** | https://github.com/fevian448/Map-Ai/settings/pages |

---

## 🚀 Backend Deployment

**Option 1: Render** (Recommended, Free)
1. Go to https://render.com
2. Connect GitHub
3. New Web Service
4. Start Command: `cd backend && npm start`
5. Deploy

**Option 2: Railway** (Free $5/month)
1. Go to https://railway.app
2. New Project → GitHub Repo
3. Select Map-Ai
4. Deploy

**Option 3: Docker** (Self-hosted)
```bash
docker build -t mapai ./backend
docker run -p 3000:3000 mapai
```

---

## 📝 Developer Account

**Email:** `fevianbenjo48@gmail.com`

Used for:
- ✅ Google Play Console
- ✅ Google Cloud APIs
- ✅ GitHub Organization
- ✅ All services

---

## 🔗 Documentation

- **Full deployment guide:** [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)
- **Developer account setup:** [DEVELOPER_ACCOUNT.md](DEVELOPER_ACCOUNT.md)
- **Android configuration:** [CONFIG.md](CONFIG.md)
- **Architecture guide:** [AGENTS.md](AGENTS.md)

---

**Status:** ✅ Ready for Deployment  
**Last Updated:** 2026-07-19
