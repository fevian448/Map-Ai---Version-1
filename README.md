# MapAi — Universal Cross-Platform AI GPS Navigation & Live Traffic

**MapAi** is a cross-platform AI GPS navigation app and Waze alternative built with **React 18 + TypeScript + Vite + Tailwind CSS** on the web frontend, **Kotlin + Jetpack Compose** for Android, **Rust / Tauri** for high-performance desktop, and an Express + Socket.IO + SQLite backend server.

It is designed to run seamlessly across all operating systems: **Android, iOS, Windows, Linux, macOS, Huawei (HarmonyOS), and Smart TVs (Android TV, Fire TV, Apple TV, WebOS, Tizen)**.

🚀 **Live Web View Demo:** [https://fevian448.github.io/Map-Ai/](https://fevian448.github.io/Map-Ai/)  
📦 **GitHub Repository:** [https://github.com/fevian448/Map-Ai](https://github.com/fevian448/Map-Ai)

---

## Key Features

| Module | Features & Capabilities |
|--------|--------------------------|
| **Interactive Map & Routing** | OpenStreetMap (Leaflet / osmdroid) & MapLibre GL, place search, waypoint navigation, OSRM & Google Directions API integration |
| **Gemini AI Navigation Copilot** | Gemini 3.6 Flash AI copilot for instant route queries, direction finding, live traffic advice, and auto-triggered navigation |
| **Live Express Delivery Hubs** | Real-time rider hubs & status indicators for **Maxim, GrabFood, GrabExpress, and Foodpanda (pandamart)** |
| **NASA Live Telemetry & Feed** | Real-time ISS station satellite tracking (speed & altitude) plus NASA Live video feed and EONET wildfire/storm alerts |
| **Live Multi-Device Phone Tracker** | Real-time tracking of family members, fleet drivers, and express riders |
| **Crowdsourced Traffic Alerts** | Real-time hazard reporting — police traps, traffic jams, accidents, roadworks, speed cameras — with density confidence scoring |
| **Smart Speedometer & Drive Tab** | Real-time GPS speedometer, speed limit warnings, road weather conditions, and speed camera alerts |
| **Media & Dashcam Vault** | Local in-app camera capture and dashcam video recording with geotagging and export |
| **Emergency SOS System** | Instant siren trigger, fake incoming call simulator, SMS/Call emergency contacts, and live location broadcasting |
| **Vercel Cron & Cloud Automation** | Scheduled daily maintenance endpoint (`/api/cron`, `vercel.json`) with `CRON_SECRET` authorization for SOS and report cache cleanup |
| **Studio Installation & Multi-Stack** | Clean Installation & Studio Build panel in Settings supporting **Gradle (Android), React (PWA), Rust (Tauri), Windows (.exe), and Smart TV** |

---

## Universal Cross-Platform & Multi-Stack Builds

MapAi supports multiple build technologies tailored for every device and operating system:

| Technology Stack | Target Platform | Build Command / Output |
|------------------|-----------------|------------------------|
| **Gradle (Android / TV)** | Android 8.0+ Phone, Tablet, Android TV, Huawei HarmonyOS | `./workflow.sh build` → `app-debug.apk` |
| **React 18 + Vite PWA** | Web Browsers, iOS Safari, Android Chrome, Edge | `npm run build` → PWA Web Manifest & Service Worker |
| **Rust + Tauri** | Windows 10/11, macOS, Linux (Debian/Ubuntu/Fedora) | `cargo tauri build` → Lightweight native `.exe` / `.deb` / `.dmg` |
| **Windows Executable** | Windows PCs, Laptops, Tablets | Installable PWA via Edge/Chrome or native Rust `.exe` |
| **Smart TV Mode** | Android TV, Fire TV, LG WebOS, Samsung Tizen | 10ft remote-friendly D-Pad view & full-screen launcher |

---

## Technology Stack

### Frontend & Web PWA
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Lucide React** icons
- **Leaflet.js** & **MapLibre GL** for map tile rendering
- **OpenStreetMap** tile servers & **OSRM** routing engine
- **PWA Web Manifest** with standalone theme configuration

### Native Android Module
- **Kotlin** + **Jetpack Compose** (Material 3)
- **osmdroid** for offline-capable OpenStreetMap tiles
- **Google Play Services Location** (FusedLocationProviderClient)
- **Retrofit 2** + **Gson** for HTTP API communications
- **Socket.IO Client** for push events

### Desktop Native Module (Rust)
- **Tauri 2** + **Rust Toolchain**
- Native C++/Rust WebView2 binding (&lt;30MB memory footprint)

### Backend Server
- **Node.js 20+** + **Express.js** API proxy
- **better-sqlite3** with WAL (Write-Ahead Logging) mode
- **Socket.IO** for WebSocket real-time push
- **Gemini 3.6 Flash AI SDK** (`@google/genai`) for route & copilot responses
- **NASA Open API** integration for APOD, EONET events, and ISS satellite tracking

---

## Project Structure

```
MapAi/
├── src/                          # Web & PWA Frontend
│   ├── components/               # React UI tabs & widgets
│   │   ├── MapView.tsx           # Leaflet / MapLibre map component
│   │   ├── ChatTab.tsx           # Gemini AI Copilot & route trigger
│   │   ├── DriveTab.tsx          # Speedometer, weather & camera warnings
│   │   ├── ExploreTab.tsx        # POIs & Maxim/Grab/Foodpanda hubs
│   │   ├── PhoneTrackerTab.tsx   # Multi-device GPS tracking
│   │   ├── GalleryVaultTab.tsx   # Media & Dashcam vault recording
│   │   ├── NasaWidget.tsx        # NASA TV Live & ISS telemetry tracking
│   │   ├── AlertsTab.tsx         # Traffic hazards & crowd alerts
│   │   ├── SettingsTab.tsx       # Studio Build & App Install launcher
│   │   ├── AppBuilderStudioModal.tsx # Personal App & Keystore generator
│   │   ├── TvInstallModal.tsx    # Multi-stack & TV installation guide
│   │   ├── GitLabHub.tsx         # GitLab repository & CI/CD status hub
│   │   └── SosTab.tsx            # Emergency SOS & siren simulator
│   ├── services/                 # API client & backend proxy handlers
│   ├── lib/                      # i18n & utilities
│   └── types.ts                  # Shared TypeScript interfaces
├── app/                          # Native Android app module (Gradle)
│   ├── api/cron/route.ts         # Vercel / Next.js Serverless Cron Route
│   └── src/main/java/com/example/mapai/
│       ├── data/                 # Models, repository & Retrofit client
│       ├── location/             # Location tracking service
│       └── ui/                   # Jetpack Compose screens
├── backend/                      # Express + SQLite + Socket.IO server
│   ├── server.js                 # API routes, Cron endpoint & Gemini/NASA proxy
│   └── public/                   # Live map web viewer
├── vercel.json                   # Vercel Cron configuration schedule
├── admob_config.properties       # AdMob App ID & Unit configuration (V-1 Empty)
├── keystore_config.properties    # Android Release signing identity credentials
├── public/                       # PWA manifest, favicon & icons
├── server.ts                     # Dev server entry point & /api/cron handler
├── workflow.sh                   # Main automation script
└── README.md                     # Documentation
```

---

## Quick Start & Installation

### 1. Web Development & Preview
```bash
# Clone the repository
git clone https://github.com/fevian448/Map-Ai.git
cd Map-Ai

# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

### 2. Android APK Build (Gradle)
```bash
# Build Android APK via Gradle wrapper
./workflow.sh build
# or run directly:
./gradlew assembleDebug
```
Output location: `app/build/outputs/apk/debug/app-debug.apk`

### 3. Backend Server Deployment
```bash
# Start backend server locally
cd backend
npm install
npm start
```

### 4. GitHub Release & Push
```bash
# Push commits and trigger workflow
./workflow.sh push
```

---

## Environment Variables Configuration

Create a `.env` or `.env.local` file in the root directory:

```env
# Optional Gemini API key for AI Copilot
GEMINI_API_KEY=your_gemini_api_key_here

# Optional NASA API key (defaults to NASA DEMO_KEY)
NASA_API_KEY=your_nasa_api_key_here

# Secret authorization key for Vercel Cron Jobs & Cloud Scheduler
CRON_SECRET=your_secret_cron_token_here

# Backend port configuration
PORT=3000
```

---

## Vercel Cron Jobs Configuration

MapAi supports scheduled serverless cron jobs for automated system maintenance (pruning expired SOS logs and stale hazard reports):

1. **Cron Schedule (`vercel.json`)**:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron",
         "schedule": "0 10 * * *"
       }
     ]
   }
   ```

2. **Route Handlers**:
   - Next.js App Router: `app/api/cron/route.ts` & `app/api/cron/route.js`
   - Express Dev Server: `server.ts` (`/api/cron`)
   - Backend Production Server: `backend/server.js` (`/api/cron`)

3. **Security Authorization**:
   - Vercel automatically passes the `Authorization: Bearer <CRON_SECRET>` header. Requests with invalid or missing secrets return `401 Unauthorized`.

---

## Automation Script Commands

MapAi includes a convenient workflow script (`./workflow.sh`):

```bash
./workflow.sh status   # Display git status, branch & build state
./workflow.sh build    # Build Android APK via Gradle
./workflow.sh push     # Commit and push changes to GitHub
./workflow.sh live     # Run backend server locally
./workflow.sh deploy   # Show cloud deployment options (Render / Railway / Docker)
```

---

## License & Open Source

This project is open-source and released under the **MIT License**.
Contributions are welcome! Feel free to open an issue or submit a pull request on GitHub.
