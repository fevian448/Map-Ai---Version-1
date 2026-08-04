# MapAi — Quick Setup untuk Live Website

## Langkah 1: Aktifkan GitHub Pages

1. Buka browser ke: https://github.com/fevian448/Map-Ai/settings/pages
2. Di bawah **"Build and deployment"** → **Source**
3. Pilih **"GitHub Actions"**
4. Klik **Save**

Tunggu 1-2 minit, kemudian buka:
```
https://fevian448.github.io/Map-Ai/
```

## Langkah 2: Aktifkan Wiki

1. Buka browser ke: https://github.com/fevian448/Map-Ai/wiki
2. Klik **"Create the first page"**
3. Selepas wiki diaktifkan, buka terminal dan jalankan:

```bash
cd /home/tukuk/AndroidStudioProjects/MapAi-wiki
git push origin master
```

## Langkah 3: Deploy Backend (Pilihan)

### Ops A: Render (Free Tier — Paling Mudah)

1. Fork repositori ini ke akaun GitHub anda
2. Pergi ke: https://dashboard.render.com/select-repo
3. Pilih repositori `Map-Ai`
4. Pilih **"Web Service"**
5. Konfigurasi:
   - Runtime: `Node.js`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Plan: `Free`
6. Klik **"Create Web Service"`

### Ops B: Railway (Free Tier)

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

### Ops C: Docker (Self-Hosted)

```bash
docker build -t mapai-backend ./backend
docker run -d -p 3000:3000 -v mapai-data:/app/data mapai-backend
```

## Langkah 4: Update Android App

1. Buka Android Studio
2. Buka **Settings** dalam app
3. Update **URL Server Backend** kepada URL production anda
4. Build dan test

## Terminal Commands

Semua perintah sudah diintegrasikan dalam script `workflow.sh`:

```bash
# From project directory
./workflow.sh status    # Show status
./workflow.sh build     # Build APK
./workflow.sh push      # Push to GitHub
./workflow.sh all       # Full workflow
./workflow.sh live      # Start backend locally
./workflow.sh wiki      # Push wiki
./workflow.sh monitor   # Open GitHub Actions
./workflow.sh pages     # Open live view
```

Atau gunakan alias `mapai` (sudah di-setup):
```bash
mapai status
mapai build
mapai push
mapai all
```

## Troubleshooting

### GitHub Pages masih 404
- Pastikan anda sudah pilih **"GitHub Actions"** sebagai source di Settings → Pages
- Tunggu 1-2 minit selepas enable
- Check tab Actions untuk lihat workflow status

### Wiki tidak boleh push
- Pastikan wiki sudah diaktifkan di GitHub (buka https://github.com/fevian448/Map-Ai/wiki)
- Wiki repo akan automatik dibuat oleh GitHub

### Backend tidak boleh connect
- Pastikan backend berjalan di `localhost:3000`
- Untuk emulator Android, gunakan `http://10.0.2.2:3000`
- Untuk peranti sebenar, gunakan IP address komputer dalam network yang sama

## Support

- Issues: https://github.com/fevian448/Map-Ai/issues
- Discussions: https://github.com/fevian448/Map-Ai/discussions
