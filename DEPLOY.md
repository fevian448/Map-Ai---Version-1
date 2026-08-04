# Deployment Guide

Panduan untuk melaksanakan **MapAi** kepada platform hosting untuk akses umum.

---

## Ringkasan Infrastruktur

MapAi memerlukan dua komponen:

| Komponen | Fungsi | Platform |
|-----------|--------|----------|
| **Backend** | REST API + Socket.IO + SQLite | Render, Railway, Fly.io, VPS |
| **Live View Web** | Peta realtime (Leaflet + Socket.IO) | GitHub Pages |

---

## 1. Deploy Backend (Pilihan Platform)

### Opsi A: Render (Recommended — Free Tier)

1. Fork repositori ini ke GitHub anda
2. Pergi ke [Render Dashboard](https://dashboard.render.com/select-repo)
3. Pilih repositori `Map-Ai`
4. Pilih **"Web Service"**
5. Konfigurasikan:
   ```
   Name: mapai-backend
   Runtime: Node.js
   Region: Singapore (atau terdekat)
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Plan: Free
   ```
6. Klik **"Advanced"** dan tambah Environment Variables (pilihan):
   ```
   GOOGLE_MAPS_API_KEY=AIzaSy... (untuk routing Google)
   LLM_ENDPOINT=https://api.openai.com/v1/chat/completions (untuk chat AI sebenar)
   LLM_KEY=sk-... (untuk chat AI sebenar)
   ```
7. Klik **"Create Web Service"**

Setelah deployment selesai, anda akan dapat URL seperti:
```
https://mapai-backend.onrender.com
```

### Opsi B: Railway (Free Tier)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login dan inisialisasi:
   ```bash
   railway login
   cd Map-Ai/backend
   railway init
   railway up
   ```

3. Atau gunakan Railway Dashboard:
   - Pergi ke [Railway.app](https://railway.app)
   - Klik **"New Project"** → **"Deploy from GitHub repo"**
   - Pilih repositori `Map-Ai`
   - Root directory: `backend`
   - Railway automatik mengesan `package.json` dan deploy

### Opsi C: Fly.io (Free Tier)

1. Install flyctl:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login dan launch:
   ```bash
   cd Map-Ai/backend
   fly auth login
   fly launch
   ```

3. Ikuti prompt untuk configure app. Pastikan:
   - Internal port: `3000`
   - Volume untuk data: `fly volumes create mapai-data --size 1`

4. Deploy:
   ```bash
   fly deploy
   ```

### Opsi D: Docker (Self-Hosted / VPS)

```bash
# Build image
docker build -t mapai-backend ./backend

# Run container
docker run -d \
  -p 3000:3000 \
  -v mapai-data:/app/data \
  --name mapai-backend \
  --restart unless-stopped \
  mapai-backend

# Check logs
docker logs -f mapai-backend
```

Untuk VPS (Ubuntu/Debian):
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone https://github.com/fevian448/Map-Ai.git
cd Map-Ai

# Build dan run
docker build -t mapai-backend ./backend
docker run -d -p 3000:3000 -v mapai-data:/app/data --restart unless-stopped mapai-backend

# Setup reverse proxy (Nginx)
sudo nano /etc/nginx/sites-available/mapai
```

### Opsi E: Vercel (Serverless — Eksperimen)

Vercel menyokong Node.js serverless functions. Tambah `vercel.json` dalam `backend/`:

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/server.js" }
  ]
}
```

Catatan: `better-sqlite3` dan `socket.io` mungkin memerlukan penyesuaian untuk serverless.

---

## 2. Deploy Live View ke GitHub Pages

Live view web (Leaflet map) akan di-deploy secara automatik ke GitHub Pages menggunakan GitHub Actions.

### Langkah-langkah:

1. **Aktifkan GitHub Pages** dalam repositori:
   - Pergi ke **Settings** → **Pages**
   - Bawah **"Build and deployment"** → **Source**
   - Pilih **"GitHub Actions"**

2. **Push perubahan** ke branch `master`:
   ```bash
   git add .github/workflows/deploy-web.yml
   git commit -m "Add GitHub Pages deployment for live view"
   git push origin master
   ```

3. **Tunggu deployment selesai**:
   - Pergi ke tab **Actions** dalam repositori GitHub
   - Lihat workflow "Deploy Live View to GitHub Pages"
   - Selepas selesai, live view akan tersedia di:
   ```
   https://fevian448.github.io/Map-Ai/
   ```

### Konfigurasi Socket.IO URL

Dalam `backend/public/index.html`, Socket.IO automatik connect ke host yang sama. Jika backend di URL berbeza, edit baris 37:

```javascript
const SERVER = 'https://your-backend-url.com'; // Ganti jika perlu
```

---

## 3. Konfigurasi Android App untuk Production

### Update Server URL

1. Buka app MapAi dalam Android Studio
2. Buka **Settings** dalam app
3. Kemas kini **URL Server Backend** kepada URL production anda:
   ```
   https://mapai-backend.onrender.com
   ```
4. Tekan **Simpan / Save**

### Google Maps API Key (Pilihan)

Jika anda menggunakan Google Directions API:

1. Daftar di [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Directions API** dan **Maps SDK for Android**
3. Create API key
4. Update `gradle.properties`:
   ```properties
   GOOGLE_MAPS_API_KEY=AIzaSy...
   ```
5. **PENTING:** Batasi API key di Google Cloud Console:
   - **Android apps** → restrict by package name dan SHA-1
   - **IP addresses** → restrict by server IP (untuk backend)

---

## 4. Verifikasi Deployment

### Test Backend

```bash
# Health check
curl https://your-backend-url.com/api/health

# Expected response:
# {"name":"MapAi Backend","status":"ok","time":...}
```

### Test Live View

Buka dalam browser:
```
https://fevian448.github.io/Map-Ai/
```

Anda seharusnya melihat:
- Peta Leaflet dengan tile OpenStreetMap
- Status connection di top-left (akan hijau jika connect ke backend)
- Panel kanan untuk laporan & SOS
- Panel bawah untuk media feed dan kontributor

### Test Android App

1. Build release APK:
   ```bash
   ./gradlew assembleRelease
   ```

2. Install ke peranti:
   ```bash
   adb install app/build/outputs/apk/release/app-release.apk
   ```

3. Test ciri:
   - Buka tab **Peta** — pastikan lokasi dan alerts muncul
   - Buka tab **Laporan** — Cuba tambah laporan baru
   - Buka tab **Darurat** — Test SOS button
   - Buka **Live View** di browser — Pastikan markers muncul secara realtime

---

## 5. Domain Kustom (Pilihan)

### Untuk Backend

Jika anda mempunyai domain tersendiri (contoh: `mapai.example.com`):

**Render:**
- Settings → Custom Domains → Add `mapai.example.com`

**Railway:**
- Settings → Domains → Add Custom Domain

**Fly.io:**
```bash
fly certs add mapai.example.com
```

### Untuk GitHub Pages

1. Dalam repositori **Settings** → **Pages**
2. Bawah **"Custom domain"**, masukkan domain anda
3. Konfigurasikan DNS provider anda:
   ```
   Type: CNAME
   Name: www
   Value: fevian448.github.io
   ```
   Atau untuk apex domain:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   ```

---

## 6. Monitoring & Maintenance

### Backend Logs

**Render:**
- Dashboard → Web Service → Logs

**Railway:**
- Dashboard → Project → Deployments → Logs

**Fly.io:**
```bash
fly logs
```

### Database Backup

SQLite database disimpan dalam volume (`/app/data`). Untuk backup:

```bash
# Fly.io
fly ssh console -C "sqlite3 /app/data/mapai.db .dump" > backup.sql

# Docker
docker exec mapai-backend sqlite3 /app/data/mapai.db .dump > backup.sql
```

### Update Deployment

Setelah anda push perubahan ke GitHub:

1. **Backend** akan auto-rebuild dan deploy (jika menggunakan Render/Railway dengan auto-deploy)
2. **Live View** akan auto-deploy ke GitHub Pages via Actions
3. **Android App** perlu manual build dan distribute APK

---

## 7. Troubleshooting Deployment

### Backend tidak start

- Semak logs untuk error
- Pastikan `PORT` environment variable diset (jika platform tidak automatik)
- Pastikan `DATA_DIR` mempunyai permission write

### Socket.IO tidak connect dari web

- Semak CORS settings dalam `server.js`
- Pastikan backend URL dalam `index.html` betul
- Semak firewall/security group membolehkan port 3000

### GitHub Pages tidak update

- Pergi ke **Settings** → **Pages** dan pastikan source adalah "GitHub Actions"
- Semak tab **Actions** untuk error dalam workflow
- Clear browser cache (GitHub Pages mempunyai CDN cache)

### Android app tidak boleh connect ke backend

- Pastikan backend menggunakan HTTPS (Android 9+ menghalangkan cleartext)
- Untuk development, `android:usesCleartextTraffic="true"` sudah diset dalam manifest
- Pastikan URL dalam Settings adalah betul (tambah `http://` atau `https://`)

---

## 8. Cost Estimation

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **Render** | 750 hours/month (web service) | $7/month (Starter) |
| **Railway** | $5 credit/month | $5/month (Hobby) |
| **Fly.io** | 3 shared-cpu-1x VMs, 3GB storage | $0.015/hour |
| **Vercel** | 100GB bandwidth, unlimited functions | $20/month (Pro) |
| **GitHub Pages** | 100GB bandwidth, unlimited sites | Free forever |

**Rekomendasi untuk production kecil:**
- Backend: Render Free Tier atau Railway ($5/month)
- Live View: GitHub Pages (free)
- Total: **$0 - $5/month**

---

*Untuk bantuan, buka [Issue](https://github.com/fevian448/Map-Ai/issues) di GitHub.*
