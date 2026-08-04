# MapAi — Universal Cross-Platform AI GPS Navigation & Live Traffic

**MapAi** is a cross-platform AI GPS navigation app and Waze alternative built with **React + TypeScript + Vite + Tailwind CSS** on the web frontend, **Kotlin + Jetpack Compose** for Android, and an Express + Socket.IO + SQLite backend server.

It is designed to run seamlessly across all operating systems: **Android, iOS, Windows, Linux, Huawei (HarmonyOS), and Web browsers (as a PWA / web app)**.

🚀 **Live Web View Demo:** [https://fevian448.github.io/Map-Ai/](https://fevian448.github.io/Map-Ai/)

---

## Key Features

| Module | Features & Capabilities |
|--------|--------------------------|
| **Interactive Map & Routing** | OpenStreetMap (Leaflet / osmdroid) & MapLibre GL, place search, waypoint navigation, OSRM & Google Directions API integration |
| **Gemini AI Navigation Copilot** | Gemini 3.6 Flash AI copilot for instant route queries, direction finding, live traffic advice, and auto-triggered navigation |
| **Live Express Delivery Hubs** | Real-time rider hubs & status indicators for **Maxim, GrabFood, GrabExpress, and Foodpanda (pandamart)** |
| **NASA Live Telemetry & Feed** | Real-time ISS station satellite tracking (speed & altitude) plus NASA Live video feed and EONET wildfire/storm alerts |
| **Live Multi-Device Phone Tracker** | Real-time tracking of family members, fleet drivers, and express riders |
| **Crowdsourced Traffic Alerts** | Real-time hazard reporting — police traps, traffic jams, accidents, roadworks, speed cameras — with confidence scoring |
| **Smart Speedometer & Drive Tab** | Real-time GPS speedometer, speed limit warnings, road weather conditions, and speed camera alerts |
| **Explore Nearby Points of Interest** | Filter nearby hubs for Fuel & EV charging, Dining, Parking, Hospitals, ATMs, and Maxim/Grab/Foodpanda delivery bays |
| **Emergency SOS System** | Instant siren trigger, fake incoming call simulator, SMS/Call emergency contacts, and live location broadcasting |
| **Cross-Platform PWA & Installable** | Full Web App Manifest & service worker capabilities for installation on Windows, iOS, Android, Linux, and Huawei |

---

## Universal Cross-Platform Compatibility

MapAi supports **all devices and operating systems**:

- **Android (APK & Web):** Native Kotlin + Jetpack Compose app or Chrome/Edge PWA.
- **iOS (iPhone & iPad):** Safari PWA with home screen installation & full-screen navigation view.
- **Windows (PC & Tablet):** Chrome, Edge, or Brave desktop PWA installation with native window frame.
- **Linux (Ubuntu, Debian, Fedora, Arch):** Any modern WebKit/Chromium browser or Linux PWA desktop shortcut.
- **Huawei (HarmonyOS & HMS):** Browser view & standalone Web App without Google Play dependency.
- **Web Browsers:** Chrome, Safari, Firefox, Edge, Opera, and Vivaldi.

---

## Technology Stack

### Frontend & Web PWA
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Lucide React** icons
- **Leaflet.js** & **MapLibre GL** for map tile rendering
- **OpenStreetMap** tile servers & **OSRM** routing engine
- **PWA Web Manifest** with standalone theme configuration

### Android Native Module
- **Kotlin** + **Jetpack Compose** (Material 3)
- **osmdroid** for offline-capable OpenStreetMap tiles
- **Google Play Services Location** (FusedLocationProviderClient)
- **Retrofit 2** + **Gson** for HTTP API communications
- **Socket.IO Client** for push events

### Backend Server
- **Node.js** + **Express.js** API proxy
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
│   │   ├── NasaWidget.tsx        # NASA TV Live & ISS telemetry tracking
│   │   ├── AlertsTab.tsx         # Traffic hazards & crowd alerts
│   │   └── SosTab.tsx            # Emergency SOS & siren simulator
│   ├── services/                 # API client & backend proxy handlers
│   ├── lib/                      # i18n & utilities
│   └── types.ts                  # Shared TypeScript interfaces
├── app/                          # Native Android app module
│   └── src/main/java/com/example/mapai/
│       ├── data/                 # Models, repository & Retrofit client
│       ├── location/             # Location tracking service
│       └── ui/                   # Jetpack Compose screens
├── backend/                      # Express + SQLite + Socket.IO server
│   ├── server.js                 # API routes & Gemini/NASA proxy
│   └── public/                   # Live map web viewer
├── public/                       # PWA manifest, favicon & icons
├── server.ts                     # Dev server entry point
├── workflow.sh                   # Main automation script
└── README.md                     # Documentation
```

---

## Quick Start & Installation

### 1. Web / Full-Stack Development
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

### 2. Backend Server Deployment
```bash
# Start backend server locally
cd backend
npm install
npm start
```

### 3. Android Debug APK Build
```bash
# Build Android APK via Gradle
./workflow.sh build
```
Output location: `app/build/outputs/apk/debug/app-debug.apk`

---

## Environment Variables Configuration

Create a `.env` or `.env.local` file in the root directory:

```env
# Optional Gemini API key for AI Copilot
GEMINI_API_KEY=your_gemini_api_key_here

# Optional NASA API key (defaults to NASA DEMO_KEY)
NASA_API_KEY=your_nasa_api_key_here

# Backend port configuration
PORT=3000
```

---

## Workflow Script Commands

MapAi includes a convenient automation script (`./workflow.sh`):

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
