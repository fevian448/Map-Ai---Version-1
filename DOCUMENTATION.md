# 📚 MapAi Documentation Hub

## 🚀 Quick Start (Choose Your Path)

### For Android Developers
```bash
# 1. Setup environment
./config.sh setup

# 2. Build APK locally
./workflow.sh build

# 3. Or use GitHub Actions (auto-deploy)
git push origin master
```
📖 **Read:** [BUILD_GUIDE.md](BUILD_GUIDE.md) *(coming soon)*

---

### For Backend Developers  
```bash
# 1. Install dependencies
cd backend && npm install

# 2. Run locally
npm start

# 3. Or deploy to free hosting
# See: FREE_DEPLOYMENT_GUIDE.md
```
📖 **Read:** [backend/README.md](backend/README.md)

---

### For DevOps/Deployment
```bash
# 1. Generate keystore
./config.sh generate-keystore

# 2. Setup GitHub automation
./setup-github-secrets.sh

# 3. Push and watch it deploy
git push origin master
```
📖 **Read:** [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)

---

## 📖 Complete Documentation

### Essential Guides
| Document | Purpose | For Whom |
|----------|---------|----------|
| [GITHUB_QUICK_START.md](GITHUB_QUICK_START.md) | ⚡ 5-minute GitHub setup | Everyone |
| [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md) | 🚀 Full deployment guide | DevOps / Deployment |
| [DEVELOPER_ACCOUNT.md](DEVELOPER_ACCOUNT.md) | 🔐 Account & credentials setup | Project Lead |
| [SETUP.md](SETUP.md) | 🛠️ Local development setup | Android Developers |
| [DEPLOY.md](DEPLOY.md) | 📦 Detailed deployment steps | Backend Developers |
| [CONFIG.md](CONFIG.md) | ⚙️ Configuration reference | All Developers |
| [AGENTS.md](AGENTS.md) | 🤖 AI Agent conventions | AI / Code Assistance |
| [IMPROVEMENTS.md](IMPROVEMENTS.md) | ✨ Recent enhancements | Project History |

---

## 🌐 Free Services Used

### Always Free
- ✅ **GitHub** — Code hosting, CI/CD, Releases
- ✅ **GitHub Pages** — Web hosting (static)
- ✅ **GitHub Actions** — 2000 minutes/month

### Free Tier (No Credit Card)
- ✅ **Render.com** — 750 hours/month backend
- ✅ **Railway** — $5/month backend
- ✅ **Docker Hub** — Container registry
- ✅ **Google Cloud** — Free APIs (within limits)

---

## 👤 Developer Account

**Primary Account:** `fevianbenjo48@gmail.com`

Used for:
- ✅ Google Play Console (Android distribution)
- ✅ Google Cloud Console (APIs, Maps, Firebase)
- ✅ GitHub Organization
- ✅ All developer services

**Documentation:** [DEVELOPER_ACCOUNT.md](DEVELOPER_ACCOUNT.md)

---

## 🎯 Current Deployment Status

| Component | Status | Link |
|-----------|--------|------|
| 📱 Android APK | ✅ Building | [Releases](https://github.com/fevian448/Map-Ai/releases) |
| 🌐 Web Live View | ✅ Live | [GitHub Pages](https://fevian448.github.io/Map-Ai/) |
| 🔧 Backend | ⏳ Setup Guide | [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md) |
| 🤖 CI/CD | ✅ Automated | [Actions](https://github.com/fevian448/Map-Ai/actions) |
| 📚 Documentation | ✅ Complete | You are here! |

---

## 🔧 Workflows Available

### Automated Workflows (GitHub Actions)

**On Push to Master:**
1. ✅ `build-apk.yml` — Build debug + release APK
2. ✅ `build-signed-apk.yml` — Build and sign APK
3. ✅ `deploy-web.yml` — Deploy live view
4. ✅ `deploy-backend-free.yml` — Backend deployment guide

**Manual Trigger:**
- Repository Actions tab → Choose workflow → "Run workflow"

---

## 📊 Project Structure

```
MapAi/
├── app/                          # Android Jetpack Compose app
│   ├── src/main/java/
│   │   └── com/example/mapai/
│   │       ├── data/             # Models, API, cache
│   │       ├── ui/               # Compose screens
│   │       ├── service/          # Services
│   │       └── util/             # Utilities
│   └── build.gradle.kts
│
├── backend/                      # Node.js Express server
│   ├── server.js                 # Main backend
│   ├── package.json              # Dependencies
│   ├── Dockerfile                # Docker setup
│   └── public/                   # Web live view
│
├── .github/
│   └── workflows/                # CI/CD automation
│       ├── build-apk.yml
│       ├── build-signed-apk.yml
│       ├── deploy-web.yml
│       └── deploy-backend-free.yml
│
├── gradle/                       # Version catalog
├── config.sh                     # Setup script
├── workflow.sh                   # CLI commands
└── setup-github-secrets.sh       # GitHub automation
```

---

## 🚀 Typical Development Flow

### 1. Local Development
```bash
cd /home/tukuk/AndroidStudioProjects/MapAi
./workflow.sh build           # Build local APK
./workflow.sh live            # Start backend
./workflow.sh status          # Check status
```

### 2. Push to GitHub
```bash
git add .
git commit -m "feat: add awesome feature"
git push origin master
```

### 3. GitHub Automation
- ✅ Actions builds APK
- ✅ Uploads to Releases
- ✅ Deploys web view
- ✅ Creates Release draft

### 4. Test & Deploy
- Download APK from Releases
- Deploy backend to Render/Railway
- Update Android app Server URL
- Test on real device

---

## 🆘 Troubleshooting

### "APK build fails in GitHub Actions"
👉 **Solution:** See [DEVELOPER_ACCOUNT.md](DEVELOPER_ACCOUNT.md) → GitHub Secrets section

### "GitHub Pages shows 404"
👉 **Solution:** See [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md) → Part 1

### "Backend won't connect from Android app"
👉 **Solution:** Check Settings → Server URL (must be deployed backend)

### "Need to reset GitHub Secrets"
👉 **Solution:** Run `./setup-github-secrets.sh` again

---

## 📝 Contributing

1. Create feature branch: `git checkout -b feature/awesome`
2. Make changes
3. Test locally: `./workflow.sh build`
4. Commit & push: `git push origin feature/awesome`
5. Create Pull Request on GitHub
6. GitHub Actions automatically tests
7. Merge when ready

**Before committing, read:** [AGENTS.md](AGENTS.md) for conventions

---

## 📞 Help & Support

| Need Help With | Documentation |
|---|---|
| GitHub setup | [GITHUB_QUICK_START.md](GITHUB_QUICK_START.md) |
| Developer accounts | [DEVELOPER_ACCOUNT.md](DEVELOPER_ACCOUNT.md) |
| Deployment | [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md) |
| Android building | [SETUP.md](SETUP.md) |
| Backend setup | [backend/README.md](backend/README.md) |
| Configuration | [CONFIG.md](CONFIG.md) |
| Recent changes | [IMPROVEMENTS.md](IMPROVEMENTS.md) |

---

## 📌 Important Links

- **Repository:** https://github.com/fevian448/Map-Ai
- **Live Demo:** https://fevian448.github.io/Map-Ai/
- **Releases:** https://github.com/fevian448/Map-Ai/releases
- **Actions:** https://github.com/fevian448/Map-Ai/actions
- **Developer Account:** fevianbenjo48@gmail.com

---

## 📈 Project Status

- ✅ Core functionality implemented
- ✅ 100% free for users
- ✅ Free deployment via GitHub
- ✅ Offline caching enabled
- ✅ Backend security hardened
- ✅ CI/CD automated
- 🔄 Ready for production testing

---

**Last Updated:** 2026-07-19  
**Documentation Status:** ✅ Complete  
**Next Phase:** Production deployment & user testing
