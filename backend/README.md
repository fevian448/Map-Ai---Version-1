# MapAi Backend

Open-source backend for the MapAi navigation app (the "better than Waze" project).

## Stack (all open source)
- **Node.js** + **Express** — HTTP API
- **better-sqlite3** — embedded file database (no external server needed)
- **Socket.IO** — realtime push (new reports, SOS, nearby devices)
- **multer** — media uploads

## Features
- `POST /api/reports` & `GET /api/reports?lat=&lon=&radius=` — crowd-sourced traffic/hazard reports
- `POST /api/reports/:id/confirm` — confirm a report (raises confidence)
- `POST /api/chat` — AI chat proxy (local fallback; plug in any LLM via `LLM_ENDPOINT`/`LLM_KEY`)
- `POST /api/sos` & `GET /api/sos` — emergency broadcasts
- `POST /api/nearby` & `GET /api/nearby` — Bluetooth/WiFi/nearby device sharing
- `GET /api/contributors` — contributor leaderboard
- `POST /api/cctv` & `GET /api/cctv` — CCTV stream registry
- `POST /api/upload` — image/proof upload

## Run locally
```bash
cd backend
npm install
npm start
# http://localhost:3000
```

## Run with Docker
```bash
docker build -t mapai-backend ./backend
docker run -p 3000:3000 -v mapai-data:/app/data mapai-backend
```

## Configure the app
In the Android app Settings → Server, point to `http://<your-ip>:3000`.
On the emulator use `http://10.0.2.2:3000`.

## Notes
- AI chat uses a local open-source fallback by default. To enable a real model,
  edit `aiFallback()` / add a `fetch()` call to your LLM endpoint in `server.js`.
- `ACCESS_FINE_LOCATION` + background location are used only for navigation & SOS.
