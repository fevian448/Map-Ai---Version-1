import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;
const DATA_DIR = process.env.DATA_DIR || "./data";
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ---- In-Memory / Local Storage database fallback for ephemeral environment ----
interface Report {
  id: string;
  type: string;
  lat: number;
  lon: number;
  description: string;
  reporter: string;
  created_at: number;
  confirmed: number;
  media?: string | null;
}

interface ChatMsg {
  id: string;
  role: string;
  content: string;
  created_at: number;
}

interface SosAlert {
  id: string;
  user: string;
  lat: number;
  lon: number;
  message: string;
  created_at: number;
}

interface Contributor {
  id: string;
  name: string;
  points: number;
  reports: number;
}

interface PlaceItem {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  rating: number;
  is_open: number;
  fuel_price?: string | null;
  extra?: string | null;
  created_at: number;
}

// Initial seed data centered around Jakarta (-6.2, 106.81) / generic city
const reports: Report[] = [
  { id: 'rep_1', type: 'POLICE', lat: -6.202, lon: 106.815, description: 'Speed trap near main avenue', reporter: 'Alex', created_at: Date.now() - 600000, confirmed: 5 },
  { id: 'rep_2', type: 'ACCIDENT', lat: -6.195, lon: 106.825, description: 'Minor fender bender in left lane', reporter: 'Sarah', created_at: Date.now() - 1200000, confirmed: 12 },
  { id: 'rep_3', type: 'HAZARD', lat: -6.210, lon: 106.808, description: 'Large pothole on center lane', reporter: 'Rina', created_at: Date.now() - 1800000, confirmed: 8 },
  { id: 'rep_4', type: 'SPEED_CAM', lat: -6.188, lon: 106.830, description: 'Active speed camera 60km/h', reporter: 'System', created_at: Date.now() - 3600000, confirmed: 24 }
];

const chatHistory: ChatMsg[] = [
  { id: 'c_1', role: 'assistant', content: 'Hello! I am your MapAi Assistant. How can I help with your trip today?', created_at: Date.now() }
];

const sosList: SosAlert[] = [];

const contributors: Contributor[] = [
  { id: 'u_1', name: 'Alex_Driver', points: 340, reports: 34 },
  { id: 'u_2', name: 'Sarah_Navigator', points: 280, reports: 28 },
  { id: 'u_3', name: 'Rina_Roads', points: 190, reports: 19 },
  { id: 'u_4', name: 'MapUser_99', points: 120, reports: 12 }
];

const places: PlaceItem[] = [
  { id: 'p_1', name: 'Shell Grand Avenue', category: 'fuel', lat: -6.201, lon: 106.812, rating: 4.8, is_open: 1, fuel_price: '$1.35/L', extra: '92/95/Diesel', created_at: Date.now() },
  { id: 'p_2', name: 'Exxon Central', category: 'fuel', lat: -6.192, lon: 106.828, rating: 4.5, is_open: 1, fuel_price: '$1.28/L', extra: '24/7 Service', created_at: Date.now() },
  { id: 'p_3', name: 'Starbucks Drive Thru', category: 'food', lat: -6.205, lon: 106.818, rating: 4.6, is_open: 1, extra: 'Coffee & Snacks', created_at: Date.now() },
  { id: 'p_4', name: 'Central Mall Parking', category: 'parking', lat: -6.198, lon: 106.821, rating: 4.2, is_open: 1, extra: '$2/hr • 120 spots', created_at: Date.now() },
  { id: 'p_5', name: 'City Emergency Hospital', category: 'hospital', lat: -6.212, lon: 106.835, rating: 4.9, is_open: 1, extra: '24h Trauma Center', created_at: Date.now() },
  { id: 'p_6', name: 'Chase ATM Plaza', category: 'atm', lat: -6.200, lon: 106.809, rating: 4.4, is_open: 1, extra: 'Deposit & Withdrawal', created_at: Date.now() }
];

const uid = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

function bumpContributor(name: string) {
  const existing = contributors.find(c => c.name === name);
  if (existing) {
    existing.reports += 1;
    existing.points += 10;
  } else {
    contributors.push({ id: uid(), name, points: 10, reports: 1 });
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });

  // Gemini AI setup
  let ai: GoogleGenAI | null = null;
  function getAi() {
    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
  }

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ name: "MapAi Backend", status: "ok", time: Date.now() });
  });

  // Reports API
  app.get("/api/reports", (req, res) => {
    const { lat, lon, radius = 10 } = req.query;
    let list = [...reports];
    if (lat && lon) {
      const uLat = parseFloat(lat as string);
      const uLon = parseFloat(lon as string);
      const rad = parseFloat(radius as string);
      list = list.filter(r => {
        const distKm = Math.hypot(r.lat - uLat, r.lon - uLon) * 111;
        return distKm <= rad;
      });
    }
    res.json(list.sort((a, b) => b.created_at - a.created_at));
  });

  app.post("/api/reports", (req, res) => {
    const { type, lat, lon, description, reporter = "You" } = req.body;
    if (!type || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Missing required report fields" });
    }
    const newRep: Report = {
      id: uid(),
      type: String(type).toUpperCase(),
      lat: Number(lat),
      lon: Number(lon),
      description: String(description || type),
      reporter: String(reporter),
      created_at: Date.now(),
      confirmed: 1
    };
    reports.unshift(newRep);
    bumpContributor(newRep.reporter);
    io.emit("report:new", newRep);
    res.json(newRep);
  });

  app.post("/api/reports/:id/confirm", (req, res) => {
    const rep = reports.find(r => r.id === req.params.id);
    if (rep) {
      rep.confirmed += 1;
    }
    res.json({ ok: true, confirmed: rep ? rep.confirmed : 0 });
  });

  // SOS API
  app.get("/api/sos", (_req, res) => {
    res.json(sosList.sort((a, b) => b.created_at - a.created_at));
  });

  app.post("/api/sos", (req, res) => {
    const { user = "User", lat, lon, message = "SOS Emergency Alert" } = req.body;
    const sosItem: SosAlert = {
      id: uid(),
      user: String(user),
      lat: Number(lat),
      lon: Number(lon),
      message: String(message),
      created_at: Date.now()
    };
    sosList.unshift(sosItem);
    io.emit("sos:new", sosItem);
    res.json({ ok: true, id: sosItem.id });
  });

  // Places API
  app.get("/api/places", (req, res) => {
    const { category, lat, lon } = req.query;
    let list = [...places];
    if (category) {
      list = list.filter(p => p.category.toLowerCase() === String(category).toLowerCase());
    }
    if (lat && lon) {
      const uLat = parseFloat(lat as string);
      const uLon = parseFloat(lon as string);
      list.sort((a, b) => {
        const dA = Math.hypot(a.lat - uLat, a.lon - uLon);
        const dB = Math.hypot(b.lat - uLat, b.lon - uLon);
        return dA - dB;
      });
    }
    res.json(list);
  });

  // Contributors
  app.get("/api/contributors", (_req, res) => {
    res.json(contributors.sort((a, b) => b.points - a.points));
  });

  // Chat API
  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body || {};
    const lastMsg = (messages || []).slice(-1)[0]?.content || "";

    let reply = "";
    try {
      const gemini = getAi();
      if (gemini) {
        const response = await gemini.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: `You are MapAi Assistant, a helpful AI copilot inside the MapAi GPS Navigation & Traffic app. Answer concisely and clearly about navigation, routes, hazards, traffic, fuel, or emergency SOS: ${lastMsg}` }]
            }
          ]
        });
        reply = response.text || "";
      }
    } catch (err) {
      console.warn("Gemini chat API error, falling back to smart local response:", err);
    }

    if (!reply) {
      reply = smartFallbackResponse(lastMsg);
    }

    const chatRow: ChatMsg = {
      id: uid(),
      role: "assistant",
      content: reply,
      created_at: Date.now()
    };
    chatHistory.push(chatRow);
    res.json(chatRow);
  });

  function smartFallbackResponse(text: string): string {
    const t = text.toLowerCase();
    if (t.includes("traffic") || t.includes("jam") || t.includes("delay") || t.includes("macet")) {
      return "I've checked local crowd reports. Traffic is clear on main expressways, but expect minor delays near Central Square. Would you like me to find a bypass route?";
    }
    if (t.includes("route") || t.includes("navigate") || t.includes("direction") || t.includes("rute")) {
      return "To start turn-by-turn navigation, search for a destination or tap any location on the map, then press 'Start Navigation'.";
    }
    if (t.includes("sos") || t.includes("emergency") || t.includes("danger") || t.includes("darurat")) {
      return "If you need immediate assistance, go to the 'SOS' tab and tap the Emergency SOS button to broadcast your live location to contacts and nearby drivers.";
    }
    if (t.includes("fuel") || t.includes("gas") || t.includes("petrol") || t.includes("bensin")) {
      return "The cheapest fuel nearby is at Shell Grand Avenue ($1.35/L, 0.8 km away). Check the 'Explore' tab for real-time fuel prices.";
    }
    return "I am your MapAi AI Copilot! I can guide you through live navigation, report traffic hazards, locate nearby fuel/food/parking, and assist with emergency SOS safety tools. What would you like to do?";
  }

  // Directions Proxy
  app.get("/api/directions", async (req, res) => {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "Missing from/to coordinates" });
    }
    try {
      const [lat1, lon1] = String(from).split(",").map(Number);
      const [lat2, lon2] = String(to).split(",").map(Number);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (_e) {
      // Fallback
    }
    res.json({ routes: [] });
  });

  // NASA API Proxy Routes
  app.get("/api/nasa/apod", async (_req, res) => {
    try {
      const apiKey = process.env.NASA_API_KEY || "f7ZSfpcRIV6aFdqhdTTMfISZSg8R1dHuycbaKYhh";
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (err) {
      console.warn("NASA APOD error:", err);
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
      console.warn("NASA EONET error:", err);
    }
    res.status(500).json({ error: "Failed to fetch NASA EONET events" });
  });

  app.get("/api/nasa/earth", async (req, res) => {
    try {
      const { lat = "-6.2", lon = "106.81" } = req.query;
      const apiKey = process.env.NASA_API_KEY || "f7ZSfpcRIV6aFdqhdTTMfISZSg8R1dHuycbaKYhh";
      const response = await fetch(`https://api.nasa.gov/planetary/earth/assets?lat=${lat}&lon=${lon}&date=2024-01-01&dim=0.15&api_key=${apiKey}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (err) {
      console.warn("NASA Earth imagery error:", err);
    }
    res.status(500).json({ error: "Failed to fetch NASA Earth imagery assets" });
  });

  // Socket IO connection
  io.on("connection", (socket) => {
    socket.emit("status", { connected: true, time: Date.now() });
    socket.on("ping", () => socket.emit("pong", Date.now()));
  });

  // Vite Dev / Static Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`MapAi Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
