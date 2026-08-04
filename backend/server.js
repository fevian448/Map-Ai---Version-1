// MapAi open-source backend
// Built with Express + better-sqlite3 + Socket.IO
// All libraries used here are open source (MIT / BSD).

import express from "express";
import http from "http";
import cors from "cors";
import multer from "multer";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || "./data";
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---- Logging ----
const logger = {
  info: (msg, ...args) => LOG_LEVEL !== "silent" && console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
};

const db = new Database(path.join(DATA_DIR, "mapai.db"));
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    description TEXT,
    reporter TEXT,
    created_at INTEGER NOT NULL,
    confirmed INTEGER DEFAULT 0,
    media TEXT
  );

  CREATE TABLE IF NOT EXISTS chat (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sos (
    id TEXT PRIMARY KEY,
    user TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    message TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media_feed (
    id TEXT PRIMARY KEY,
    author TEXT,
    filename TEXT NOT NULL,
    kind TEXT,
    lat REAL,
    lon REAL,
    caption TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nearby (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    meta TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contributors (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    points INTEGER DEFAULT 0,
    reports INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cctv (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    rating REAL DEFAULT 4.0,
    is_open INTEGER DEFAULT 1,
    fuel_price TEXT,
    extra TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_reports_geo ON reports(lat, lon);
  CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
  CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
  CREATE INDEX IF NOT EXISTS idx_sos_created ON sos(created_at);
  CREATE INDEX IF NOT EXISTS idx_media_created ON media_feed(created_at);
  CREATE INDEX IF NOT EXISTS idx_nearby_created ON nearby(created_at);
  CREATE INDEX IF NOT EXISTS idx_places_geo ON places(lat, lon);
  CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
  CREATE INDEX IF NOT EXISTS idx_places_created ON places(created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_created ON chat(created_at);
`);

logger.info("Database initialized with indices for better performance");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---- Rate Limiting (simple in-memory) ----
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, 0);
  }
  
  const count = rateLimitStore.get(key) + 1;
  rateLimitStore.set(key, count);
  
  if (count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  
  next();
}

app.use(rateLimiter);

// ---- Input Validation ----
function validateCoordinates(lat, lon) {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  return !isNaN(latNum) && !isNaN(lonNum) && 
         latNum >= -90 && latNum <= 90 && 
         lonNum >= -180 && lonNum <= 180;
}

function sanitizeString(str, maxLength = 500) {
  if (!str) return "";
  return String(str)
    .substring(0, maxLength)
    .replace(/[<>]/g, "")
    .trim();
}

function validateAlertType(type) {
  const valid = ["HAZARD", "POLICE", "ACCIDENT", "ROADWORK", "SPEED_CAM", "TRAFFIC", "RADAR", "ROBOT", "TRAIN", "BUS"];
  return valid.includes(String(type).toUpperCase());
}

// ---- Error Handler ----
function errorHandler(err, req, res, next) {
  logger.error("Request error:", err.message);
  res.status(500).json({ error: "Internal server error" });
}
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ---- File Upload Config ----
const upload = multer({ 
  dest: UPLOAD_DIR, 
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|mp4|webm)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

// ---- helpers ----
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---- Reports (crowd-sourced traffic / hazards) ----
app.get("/api/reports", (req, res) => {
  const { lat, lon, radius = 5 } = req.query;
  let rows = db.prepare("SELECT * FROM reports ORDER BY created_at DESC LIMIT 200").all();
  if (lat && lon) {
    const r = parseFloat(radius);
    rows = rows.filter(r2 => {
      const d = Math.hypot(r2.lat - parseFloat(lat), r2.lon - parseFloat(lon)) * 111;
      return d <= r;
    });
  }
  res.json(rows);
});

app.post("/api/reports", (req, res) => {
  try {
    const { type, lat, lon, description, reporter = "anon", media } = req.body;
    
    // Validation
    if (!type || !validateAlertType(type)) {
      return res.status(400).json({ error: "Invalid alert type" });
    }
    if (!validateCoordinates(lat, lon)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    
    const id = uid();
    const sanitizedDesc = sanitizeString(description, 500);
    const sanitizedReporter = sanitizeString(reporter, 50);
    
    db.prepare(`INSERT INTO reports (id,type,lat,lon,description,reporter,created_at,confirmed,media)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
        id, type.toUpperCase(), lat, lon, sanitizedDesc, sanitizedReporter, Date.now(), 1, media || null
      );
    
    const row = db.prepare("SELECT * FROM reports WHERE id=?").get(id);
    io.emit("report:new", row);
    bumpContributor(sanitizedReporter);
    
    logger.info(`New report: ${type} at ${lat},${lon}`);
    res.json(row);
  } catch (err) {
    logger.error("POST /api/reports error:", err.message);
    res.status(500).json({ error: "Failed to create report" });
  }
});

app.post("/api/reports/:id/confirm", (req, res) => {
  db.prepare("UPDATE reports SET confirmed = confirmed + 1 WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// ---- Chat (Gemini 3.6 Flash AI Navigation Assistant with fallback) ----
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body || {};
  const last = (messages || []).slice(-1)[0]?.content || "";
  let reply = "";

  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `You are MapAi Assistant, a helpful AI copilot inside the MapAi GPS Navigation & Traffic app. Answer concisely and clearly about navigation, routes, hazards, Maxim/Grab/Foodpanda delivery, traffic, fuel, or emergency SOS: ${last}` }]
          }
        ]
      });
      reply = response.text || "";
    } catch (err) {
      logger.warn("Gemini chat error in backend/server.js:", err.message);
    }
  }

  if (!reply) {
    reply = aiFallback(last);
  }

  const row = { id: uid(), role: "assistant", content: reply, created_at: Date.now() };
  db.prepare("INSERT INTO chat (id,role,content,created_at) VALUES (?,?,?,?)").run(row.id, row.role, row.content, row.created_at);
  res.json(row);
});

function aiFallback(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("macet") || t.includes("traffic")) return "Cek laporan terdekat di tab Laporan. Hindari ruas utama saat jam sibuk.";
  if (t.includes("rute") || t.includes("route")) return "Tentukan tujuan di Peta, lalu ketuk 'Mulai Navigasi' untuk rute terbaik.";
  if (t.includes("sos") || t.includes("darurat")) return "Buka menu Darurat/SOS, ketuk tombol merah untuk kirim lokasi ke kontak darurat.";
  return "Saya asisten MapAi. Saya bisa bantu soal navigasi, lalu lintas, dan fitur darurat. Tanya apa saja!";
}

// ---- SOS ----
app.post("/api/sos", (req, res) => {
  try {
    const { user = "anon", lat, lon, message = "SOS" } = req.body;
    
    if (!validateCoordinates(lat, lon)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    
    const id = uid();
    const sanitizedUser = sanitizeString(user, 50);
    const sanitizedMsg = sanitizeString(message, 200);
    
    db.prepare("INSERT INTO sos (id,user,lat,lon,message,created_at) VALUES (?,?,?,?,?,?)").run(
      id, sanitizedUser, lat, lon, sanitizedMsg, Date.now()
    );
    
    io.emit("sos:new", { id, user: sanitizedUser, lat, lon, message: sanitizedMsg });
    logger.info(`SOS alert from ${sanitizedUser}`);
    res.json({ ok: true, id });
  } catch (err) {
    logger.error("POST /api/sos error:", err.message);
    res.status(500).json({ error: "Failed to create SOS" });
  }
});
app.get("/api/sos", (req, res) => res.json(db.prepare("SELECT * FROM sos ORDER BY created_at DESC LIMIT 50").all()));

// ---- Nearby (BLE / wifi / contributors broadcast) ----
app.get("/api/nearby", (req, res) => res.json(db.prepare("SELECT * FROM nearby ORDER BY created_at DESC LIMIT 200").all()));
app.post("/api/nearby", (req, res) => {
  try {
    const { name, kind, lat, lon, meta } = req.body;
    
    if (!name || !kind) {
      return res.status(400).json({ error: "name and kind required" });
    }
    if (!validateCoordinates(lat, lon)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    
    const id = uid();
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedKind = sanitizeString(kind, 50);
    
    db.prepare("INSERT INTO nearby (id,name,kind,lat,lon,meta,created_at) VALUES (?,?,?,?,?,?,?)").run(
      id, sanitizedName, sanitizedKind, lat, lon, JSON.stringify(meta || {}), Date.now()
    );
    
    io.emit("nearby:new", { id, name: sanitizedName, kind: sanitizedKind, lat, lon });
    res.json({ ok: true, id });
  } catch (err) {
    logger.error("POST /api/nearby error:", err.message);
    res.status(500).json({ error: "Failed to create nearby record" });
  }
});

// ---- Contributors / leaderboard ----
function bumpContributor(name) {
  const existing = db.prepare("SELECT * FROM contributors WHERE name=?").get(name);
  if (existing) db.prepare("UPDATE contributors SET reports=reports+1, points=points+10 WHERE name=?").run(name);
  else db.prepare("INSERT INTO contributors (id,name,points,reports) VALUES (?,?,?,?)").run(uid(), name, 10, 1);
}
app.get("/api/contributors", (req, res) => res.json(db.prepare("SELECT * FROM contributors ORDER BY points DESC LIMIT 50").all()));

// ---- CCTV registry ----
app.get("/api/cctv", (req, res) => res.json(db.prepare("SELECT * FROM cctv").all()));
app.post("/api/cctv", (req, res) => {
  try {
    const { name, url, lat, lon } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: "name and url required" });
    }
    if (!validateCoordinates(lat, lon)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    
    const id = uid();
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedUrl = sanitizeString(url, 500);
    
    db.prepare("INSERT INTO cctv (id,name,url,lat,lon) VALUES (?,?,?,?,?)").run(
      id, sanitizedName, sanitizedUrl, lat, lon
    );
    
    logger.info(`New CCTV: ${sanitizedName}`);
    res.json({ ok: true, id });
  } catch (err) {
    logger.error("POST /api/cctv error:", err.message);
    res.status(500).json({ error: "Failed to create CCTV record" });
  }
});

// ---- Media upload + live feed ----
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  const { author = "anon", kind = "image", lat, lon, caption = "" } = req.body;
  const id = uid();
  const isVideo = (req.file.mimetype || "").startsWith("video");
  db.prepare("INSERT INTO media_feed (id,author,filename,kind,lat,lon,caption,created_at) VALUES (?,?,?,?,?,?,?,?)")
    .run(id, author, req.file.filename, isVideo ? "video" : "image", lat ? parseFloat(lat) : null, lon ? parseFloat(lon) : null, caption, Date.now());
  const row = db.prepare("SELECT * FROM media_feed WHERE id=?").get(id);
  io.emit("media:new", row);
  res.json(row);
});

app.get("/api/feed", (req, res) =>
  res.json(db.prepare("SELECT * FROM media_feed ORDER BY created_at DESC LIMIT 100").all())
);

app.use("/media", express.static(UPLOAD_DIR));

// ---- Public website (live view) ----
app.use(express.static(path.join(process.cwd(), "public")));

// ---- Health ----
app.get("/api/health", (req, res) => res.json({ name: "MapAi Backend", status: "ok", time: Date.now() }));

// ---- Places (nearby POI) ----
app.get("/api/places", (req, res) => {
  const { lat, lon, radius = 5, category } = req.query;
  let rows = db.prepare("SELECT * FROM places ORDER BY created_at DESC LIMIT 200").all();
  if (lat && lon && validateCoordinates(lat, lon)) {
    const r = parseFloat(radius);
    rows = rows.filter(p2 => {
      const d = Math.hypot(p2.lat - parseFloat(lat), p2.lon - parseFloat(lon)) * 111;
      return d <= r && (!category || p2.category === category);
    });
  }
  res.json(rows);
});

app.post("/api/places", (req, res) => {
  try {
    const { name, category, lat, lon, rating = 4.0, is_open = true, fuel_price, extra } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: "name and category required" });
    }
    if (!validateCoordinates(lat, lon)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }
    
    const id = uid();
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedCategory = sanitizeString(category, 50);
    const sanitizedPrice = sanitizeString(fuel_price, 50);
    const sanitizedExtra = sanitizeString(extra, 200);
    
    const ratingNum = Math.max(0, Math.min(5, parseFloat(rating) || 4.0));
    
    db.prepare(`INSERT INTO places (id,name,category,lat,lon,rating,is_open,fuel_price,extra,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
        id, sanitizedName, sanitizedCategory, lat, lon, ratingNum, is_open ? 1 : 0, 
        sanitizedPrice || null, sanitizedExtra || null, Date.now()
      );
    
    const row = db.prepare("SELECT * FROM places WHERE id=?").get(id);
    io.emit("place:new", row);
    
    logger.info(`New place: ${sanitizedName} (${sanitizedCategory})`);
    res.json(row);
  } catch (err) {
    logger.error("POST /api/places error:", err.message);
    res.status(500).json({ error: "Failed to create place" });
  }
});

// ---- Directions proxy (OSRM open-source by default; plug Google if key provided) ----
app.get("/api/directions", (req, res) => {
  const { from, to, profile = "driving" } = req.query;
  if (!from || !to) return res.status(400).json({ error: "from and to required" });
  const [lat1, lon1] = from.split(",").map(Number);
  const [lat2, lon2] = to.split(",").map(Number);
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lon1}&destination=${lat2},${lon2}&key=${googleKey}`;
    fetch(url).then(r => r.json()).then(data => res.json(data)).catch(() => res.json({ error: "directions_failed" }));
  } else {
    const osrm = `https://router.project-osrm.org/route/v1/${profile}/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    fetch(osrm).then(r => r.json()).then(data => res.json(data)).catch(() => res.json({ error: "directions_failed" }));
  }
});

// ---- NASA Open API Proxy Routes ----
app.get("/api/nasa/apod", async (_req, res) => {
  try {
    const apiKey = process.env.NASA_API_KEY || "f7ZSfpcRIV6aFdqhdTTMfISZSg8R1dHuycbaKYhh";
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (err) {
    logger.error("NASA APOD error:", err.message);
  }
  res.status(500).json({ error: "Failed to fetch NASA APOD" });
});

app.get("/api/nasa/eonet", async (_req, res) => {
  try {
    const apiKey = process.env.NASA_API_KEY || "f7ZSfpcRIV6aFdqhdTTMfISZSg8R1dHuycbaKYhh";
    const response = await fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?limit=10&api_key=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (err) {
    logger.error("NASA EONET error:", err.message);
  }
  res.status(500).json({ error: "Failed to fetch NASA EONET" });
});

io.on("connection", (socket) => {
  socket.on("ping", () => socket.emit("pong", Date.now()));
});

server.listen(PORT, () => console.log(`MapAi backend listening on :${PORT}`));
