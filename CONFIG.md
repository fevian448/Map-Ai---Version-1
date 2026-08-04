# MapAi — Semua ID dan Kunci Konfigurasi

Dokumen ini menyenaraikan semua ID, kunci, dan konfigurasi yang diperlukan untuk aplikasi MapAi.

---

## 1. Android App

| Item | ID / Value | Keterangan |
|------|-----------|------------|
| **Package Name** | `com.example.mapai` | Nama package aplikasi |
| **Application ID** | `com.example.mapai` | ID unik aplikasi di Google Play |
| **Version Code** | `1` | Versi kod untuk update |
| **Version Name** | `1.0` | Versi paparan kepada pengguna |
| **Min SDK** | `24` (Android 7.0) | Minimum Android version |
| **Target SDK** | `36` | Target Android version |
| **Google Maps API Key** | `AIzaSyBLApTRwV8HEm8xlLQTNfZyDcByUx_2hYU` | Untuk Maps SDK + Directions API |

### Google Maps API Key
- **Console:** https://console.cloud.google.com/apis/credentials
- **APIs needed:**
  - Maps SDK for Android
  - Directions API
  - Geocoding API
- **Restriction:** Restrict to Android apps (package: `com.example.mapai` + SHA-1)

---

## 2. AdMob (Google Mobile Ads)

### Test IDs (Default dalam Projek)
| Item | ID |
|------|-----|
| **AdMob App ID** | `ca-app-pub-3940256099942544~3347511713` |
| **Banner Ad Unit** | `ca-app-pub-3940256099942544/6300978111` |
| **Interstitial Ad Unit** | `ca-app-pub-3940256099942544/1033173712` |
| **Rewarded Ad Unit** | `ca-app-pub-3940256099942544/5224354917` |

### Cara Dapatkan Real IDs:
1. Pergi ke https://admob.google.com
2. Daftar / log masuk dengan akaun Google
3. Cipta aplikasi baru (pilih Android)
4. Daftar peranti (package: `com.example.mapai`)
5. Cipta ad unit untuk setiap jenis iklan
6. Gantikan test IDs di atas dengan real IDs

### Di Mana ID Ini Digunakan:
- `AndroidManifest.xml` — AdMob App ID (meta-data)
- `AdMobManager.kt` — Utility untuk memuat dan memaparkan iklan
- `admob_config.properties` — Template konfigurasi

---

## 3. Backend

| Item | URL / ID | Keterangan |
|------|----------|------------|
| **Default Local URL** | `http://10.0.2.2:3000` | Emulator Android |
| **Localhost URL** | `http://localhost:3000` | Browser / peranti sebenar |
| **Health Check** | `http://localhost:3000/api/health` | Semak status backend |
| **API Base** | `http://localhost:3000/api` | Semua endpoint REST |
| **Socket.IO** | `http://localhost:3000` | Realtime events |
| **Live View** | `http://localhost:3000/` | Web interface (Leaflet) |

### Environment Variables (Backend):
| Variable | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `3000` | Port pelayan |
| `DATA_DIR` | `./data` | Direktori SQLite database |
| `GOOGLE_MAPS_API_KEY` | — | Untuk Google Directions API |
| `LLM_ENDPOINT` | — | URL endpoint LLM untuk chat AI |
| `LLM_KEY` | — | API key untuk LLM |

---

## 4. GitHub

| Item | URL / ID | Keterangan |
|------|----------|------------|
| **Repository** | https://github.com/fevian448/Map-Ai | Repositori utama |
| **GitHub Pages** | https://fevian448.github.io/Map-Ai/ | Live view web |
| **GitHub Actions** | https://github.com/fevian448/Map-Ai/actions | CI/CD workflows |
| **Wiki** | https://github.com/fevian448/Map-Ai/wiki | Dokumentasi wiki |
| **Issues** | https://github.com/fevian448/Map-Ai/issues | Bug reports & feature requests |
| **Releases** | https://github.com/fevian448/Map-Ai/releases | APK releases |

### GitHub Actions Secrets (untuk CI/CD):
| Secret | Keterangan |
|--------|------------|
| `SIGNING_KEY_STORE_PATH` | Path ke keystore untuk signing APK |
| `SIGNING_KEY_STORE_PASSWORD` | Password keystore |
| `SIGNING_KEY_ALIAS` | Alias kunci dalam keystore |
| `SIGNING_KEY_PASSWORD` | Password kunci |
| `ADMOB_APP_ID` | AdMob App ID (real) |
| `ADMOB_BANNER_ID` | Banner ad unit ID (real) |
| `BACKEND_URL` | URL backend production |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |

---

## 5. Signing Keystore

| Item | Value / Location | Keterangan |
|------|------------------|------------|
| **Keystore File** | `mapai-release.keystore` | Fail keystore untuk signing |
| **Keystore Alias** | `mapai` | Alias untuk kunci dalam keystore |
| **Validity** | 10,000 days (~27 tahun) | Tempoh sah kunci |
| **Key Algorithm** | RSA 2048 | Jenis enkripsi |

### Cara Jana Keystore:
```bash
cd /home/tukuk/AndroidStudioProjects/MapAi
./config.sh generate-keystore
```

Atau manual dengan `keytool`:
```bash
keytool -genkeypair -v \
  -keystore mapai-release.keystore \
  -alias mapai \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_PASSWORD \
  -keypass YOUR_PASSWORD \
  -dname "CN=MapAi, O=MapAi, L=Jakarta, ST=Jakarta, C=ID"
```

### Penggunaan dalam Gradle:
```properties
# gradle.properties
MYAPP_RELEASE_STORE_FILE=mapai-release.keystore
MYAPP_RELEASE_KEY_ALIAS=mapai
MYAPP_RELEASE_STORE_PASSWORD=your_password
MYAPP_RELEASE_KEY_PASSWORD=your_password
```

---

## 6. Socket.IO Events (Realtime)

| Event | Arah | Data | Keterangan |
|-------|------|------|------------|
| `report:new` | Server → Client | `{ id, type, lat, lon, description, reporter, created_at }` | Laporan baru |
| `sos:new` | Server → Client | `{ id, user, lat, lon, message }` | SOS baru |
| `place:new` | Server → Client | `{ id, name, category, lat, lon, rating }` | Place baru |
| `media:new` | Server → Client | `{ id, author, filename, kind, caption }` | Media baru |
| `ping` / `pong` | Both | Heartbeat | Connection keep-alive |

---

## 7. REST API Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/api/reports?lat=&lon=&radius=` | Senarai laporan |
| `POST` | `/api/reports` | Cipta laporan |
| `POST` | `/api/reports/:id/confirm` | Konfirmasi laporan |
| `POST` | `/api/chat` | Chat AI |
| `POST` | `/api/sos` | Hantar SOS |
| `GET` | `/api/sos` | Senarai SOS |
| `GET` | `/api/places?lat=&lon=&radius=` | Senarai places |
| `POST` | `/api/places` | Daftar place |
| `GET` | `/api/directions?from=&to=` | Routing (OSRM/Google) |
| `GET` | `/api/nearby` | Peranti berdekatan |
| `POST` | `/api/nearby` | Daftar peranti |
| `GET` | `/api/contributors` | Leaderboard |
| `GET` | `/api/cctv` | Senarai CCTV |
| `POST` | `/api/cctv` | Daftar CCTV |
| `POST` | `/api/upload` | Muat naik media |
| `GET` | `/api/feed` | Media feed |
| `GET` | `/media/:filename` | Akses media |
| `GET` | `/api/health` | Health check |

---

## 8. Fail Konfigurasi dalam Projek

| Fail | Lokasi | Keterangan |
|------|--------|------------|
| `gradle.properties` | Root | Build config + Google Maps API key |
| `local.properties` | Root (git-ignored) | SDK path + signing config |
| `admob_config.properties` | Root | AdMob IDs template |
| `AndroidManifest.xml` | `app/src/main/` | Permissions + AdMob App ID + Google Maps key |
| `config.sh` | Root | Script jana semua konfigurasi |
| `workflow.sh` | Root | Android Studio + GitHub integration |
| `deploy.sh` | Root | Backend deployment helper |
| `.github/secrets.example` | `.github/` | Template untuk GitHub Actions secrets |

---

## 9. Nombor IDs Penting

| ID | Nombor | Keterangan |
|----|--------|------------|
| Package hash / SHA-1 | Dapatkan dari keystore | Untuk restrict Google Maps API key |
| App signing certificate | Dari keystore | Untuk upload ke Google Play |
| Version Code | `1` | Meningkat untuk setiap release |
| Version Name | `1.0` | Paparan pengguna |

### Cara Dapatkan SHA-1:
```bash
# Debug keystore (auto-generated by Android Studio)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release keystore (yang anda jana)
keytool -list -v -keystore /path/to/mapai-release.keystore -alias mapai
```

---

## 10. Checklist Sebelum Release

- [ ] Ganti AdMob test IDs dengan real IDs
- [ ] Jana release keystore (`./config.sh generate-keystore`)
- [ ] Daftar SHA-1 fingerprint di Google Cloud Console
- [ ] Enable APIs yang diperlukan (Maps, Directions, Geocoding)
- [ ] Update `BACKEND_URL` dalam GitHub Actions secrets
- [ ] Test app dengan real backend URL
- [ ] Build release APK (`./gradlew assembleRelease`)
- [ ] Sign APK dengan release keystore
- [ ] Upload ke Google Play Console

---

*Dokumen ini dijana automatik oleh `config.sh`. Jalankan `./config.sh show` untuk lihat semula.*
