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

  // Vercel & Cloud Cron Jobs API
  app.get("/api/cron", (req, res) => {
    const authHeader = req.headers["authorization"] || req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    // Check CRON_SECRET if configured in environment
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or missing CRON_SECRET authorization header"
      });
    }

    // Perform scheduled maintenance tasks
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    // Prune expired SOS alerts older than 24 hours
    const initialSosCount = sosList.length;
    for (let i = sosList.length - 1; i >= 0; i--) {
      if (sosList[i].created_at < twentyFourHoursAgo) {
        sosList.splice(i, 1);
      }
    }
    const prunedSosCount = initialSosCount - sosList.length;

    res.json({
      ok: true,
      status: "success",
      message: "MapAi Cron Job executed successfully",
      timestamp: new Date().toISOString(),
      prunedSosCount,
      activeReports: reports.length,
      activeContributors: contributors.length
    });
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

  // Active Online Drivers & Riders API (Live Map Connectivity with 40-50 Phone Tracker Cluster Detection)
  app.get("/api/active-drivers", (req, res) => {
    const { lat, lon } = req.query;
    const uLat = lat ? parseFloat(lat as string) : 3.139;
    const uLon = lon ? parseFloat(lon as string) : 101.6869;

    const roles = [
      { role: "Motorcycle", emoji: "🏍️" },
      { role: "Maxim Rider", emoji: "🛵" },
      { role: "Foodpanda", emoji: "🍔" },
      { role: "Grab", emoji: "💚" },
      { role: "Taxi", emoji: "🚕" },
      { role: "Driver", emoji: "🚗" }
    ];

    const names = [
      "Faiz", "Abang_Maxim", "Siti_Panda", "Uncle_Sam", "Ahmad", "Gamer_99",
      "Rider_Danial", "Captain_EV", "Rizal_Delivery", "Zul_Express", "Bakar_Taxi",
      "Hafiz", "Kamal", "Rina_Rider", "Aiman", "Yusof", "Farhan", "Syafiq", "Razak",
      "Imran", "Nizam", "Ashraf", "Fikri", "Syahmi", "Helmi", "Khairul", "Asraf",
      "Jamal", "Badrul", "Hariz", "Kassim", "Taufiq", "Anuar", "Irwan", "Mustafa",
      "Hamid", "Ghani", "Rahman", "Johan", "Shukri", "Latif", "Faizal", "Amin", "Hadi",
      "Zul_Rider", "Zahar", "Roslan", "Mamat"
    ];

    // Generate 48 active phone trackers clustered within a 1.2km radius
    const mockActiveDrivers = names.map((name, idx) => {
      const r = roles[idx % roles.length];
      const distanceMeters = 80 + (idx * 22) % 1100;
      const angleDeg = (idx * 37) % 360;
      const rad = (angleDeg * Math.PI) / 180;
      const dLat = (distanceMeters * Math.cos(rad)) / 111000;
      const dLon = (distanceMeters * Math.sin(rad)) / (111000 * Math.cos((uLat * Math.PI) / 180));

      return {
        id: `drv_${idx + 1}`,
        name: `${name}_${10 + (idx % 89)}`,
        role: r.role,
        vehicleEmoji: r.emoji,
        lat: uLat + dLat,
        lon: uLon + dLon,
        speedKmh: Math.floor(12 + (idx % 35)),
        status: idx % 3 === 0 ? "Navigating" : idx % 5 === 0 ? "Delivering" : "Online"
      };
    });

    res.json(mockActiveDrivers);
  });


  // Geocoding Global Place & City Search API
  app.get("/api/geocoding", async (req, res) => {
    const { q, lat, lon } = req.query;
    const queryStr = String(q || "").trim();
    if (!queryStr) {
      return res.json([]);
    }

    try {
      // 1. Try Nominatim OpenStreetMap Geocoding API first
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&addressdetails=1&limit=10`;
      if (lat && lon) {
        searchUrl += `&viewbox=${Number(lon) - 2},${Number(lat) + 2},${Number(lon) + 2},${Number(lat) - 2}`;
      }

      const nomRes = await fetch(searchUrl, {
        headers: { "User-Agent": "MapAi-GPS-Navigation/1.0 (fevianbenjo48@gmail.com)" }
      });

      if (nomRes.ok) {
        const data = await nomRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item: any, idx: number) => ({
            id: `nom_${item.place_id || idx}_${Date.now()}`,
            name: item.name || item.display_name.split(',')[0] || queryStr,
            address: item.display_name,
            point: {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon)
            },
            type: item.type || item.class || 'location',
            country: item.address?.country || ''
          }));
          return res.json(formatted);
        }
      }
    } catch (err) {
      console.warn("Nominatim geocoding error, trying Photon fallback:", err);
    }

    try {
      // 2. High reliability fallback: Komoot Photon Geocoding API
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryStr)}&limit=10${lat && lon ? `&lat=${lat}&lon=${lon}` : ''}`;
      const photonRes = await fetch(photonUrl);
      if (photonRes.ok) {
        const pData = await photonRes.json();
        if (pData.features && pData.features.length > 0) {
          const formatted = pData.features.map((f: any, idx: number) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const name = props.name || props.city || props.street || queryStr;
            const parts = [props.name, props.city, props.state, props.country].filter(Boolean);
            return {
              id: `photon_${props.osm_id || idx}_${Date.now()}`,
              name,
              address: parts.join(', ') || name,
              point: {
                latitude: coords[1],
                longitude: coords[0]
              },
              type: props.osm_value || 'place',
              country: props.country || ''
            };
          });
          return res.json(formatted);
        }
      }
    } catch (pErr) {
      console.warn("Photon geocoding error:", pErr);
    }

    // 3. Fallback to local place search
    const localMatch = places
      .filter(p => p.name.toLowerCase().includes(queryStr.toLowerCase()))
      .map(p => ({
        id: p.id,
        name: p.name,
        address: `${p.name} (${p.category})`,
        point: { latitude: p.lat, longitude: p.lon },
        type: p.category
      }));

    res.json(localMatch);
  });

  // Multi-Provider AI Chat API
  app.post("/api/chat", async (req, res) => {
    const { messages, provider = 'gemini_flash', apiKey, customEndpoint } = req.body || {};
    const lastMsg = (messages || []).slice(-1)[0]?.content || "";

    let reply = "";
    const systemPrompt = "You are MapAi Assistant, an intelligent AI copilot inside the MapAi GPS Navigation & Traffic app. Answer concisely and clearly about navigation, routes, hazards, traffic, fuel, or emergency SOS.";

    try {
      // Option A: Gemini 3.6 Flash or Gemini 3.1 Pro
      if (provider === 'gemini_flash' || provider === 'gemini_pro') {
        const gemini = getAi();
        if (gemini) {
          const selectedModel = provider === 'gemini_pro' ? 'gemini-3.1-pro-preview' : 'gemini-3.6-flash';
          const response = await gemini.models.generateContent({
            model: selectedModel,
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}: ${lastMsg}` }]
              }
            ]
          });
          reply = response.text || "";
        }
      } 
      // Option B: Groq High Speed AI
      else if (provider === 'groq') {
        const groqKey = apiKey || process.env.GROQ_API_KEY;
        const groqUrl = customEndpoint || "https://api.groq.com/openai/v1/chat/completions";
        if (groqKey) {
          const gRes = await fetch(groqUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: lastMsg }
              ]
            })
          });
          if (gRes.ok) {
            const gData = await gRes.json();
            reply = gData.choices?.[0]?.message?.content || "";
          }
        }
      }
      // Option C: OpenRouter (Universal Aggregator)
      else if (provider === 'openrouter') {
        const orKey = apiKey || process.env.OPENROUTER_API_KEY;
        const orUrl = customEndpoint || "https://openrouter.ai/api/v1/chat/completions";
        if (orKey) {
          const orRes = await fetch(orUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${orKey}`,
              "HTTP-Referer": "https://fevian448.github.io/Map-Ai/",
              "X-Title": "MapAi Navigation"
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-001",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: lastMsg }
              ]
            })
          });
          if (orRes.ok) {
            const orData = await orRes.json();
            reply = orData.choices?.[0]?.message?.content || "";
          }
        }
      }
      // Option D: Anthropic Claude
      else if (provider === 'anthropic') {
        const antKey = apiKey || process.env.ANTHROPIC_API_KEY;
        const antUrl = customEndpoint || "https://api.anthropic.com/v1/messages";
        if (antKey) {
          const antRes = await fetch(antUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": antKey,
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 1024,
              system: systemPrompt,
              messages: [{ role: "user", content: lastMsg }]
            })
          });
          if (antRes.ok) {
            const antData = await antRes.json();
            reply = antData.content?.[0]?.text || "";
          }
        }
      }
      // Option E: Hugging Face / Open Models
      else if (provider === 'huggingface') {
        const hfKey = apiKey || process.env.HUGGINGFACE_API_KEY;
        const modelUrl = customEndpoint || "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct";
        if (hfKey) {
          const hfRes = await fetch(modelUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${hfKey}`
            },
            body: JSON.stringify({
              inputs: `${systemPrompt}\nUser: ${lastMsg}\nAssistant:`
            })
          });
          if (hfRes.ok) {
            const hfData = await hfRes.json();
            reply = Array.isArray(hfData) ? hfData[0]?.generated_text || "" : hfData.generated_text || "";
          }
        }
      } 
      // Option C: DeepSeek / Custom AI Endpoint
      else if (provider === 'deepseek') {
        const dsKey = apiKey || process.env.DEEPSEEK_API_KEY;
        const dsUrl = customEndpoint || "https://api.deepseek.com/chat/completions";
        if (dsKey) {
          const dsRes = await fetch(dsUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${dsKey}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: lastMsg }
              ]
            })
          });
          if (dsRes.ok) {
            const dsData = await dsRes.json();
            reply = dsData.choices?.[0]?.message?.content || "";
          }
        }
      }
      // Option D: OpenAI / Compatible
      else if (provider === 'openai') {
        const oaKey = apiKey || process.env.OPENAI_API_KEY;
        const oaUrl = customEndpoint || "https://api.openai.com/v1/chat/completions";
        if (oaKey) {
          const oaRes = await fetch(oaUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${oaKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: lastMsg }
              ]
            })
          });
          if (oaRes.ok) {
            const oaData = await oaRes.json();
            reply = oaData.choices?.[0]?.message?.content || "";
          }
        }
      }
    } catch (err) {
      console.warn("AI Chat provider API error, falling back to default:", err);
    }

    // Fallback if provider call didn't produce text
    if (!reply) {
      try {
        const fallbackGemini = getAi();
        if (fallbackGemini) {
          const resG = await fallbackGemini.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [{ role: "user", parts: [{ text: `${systemPrompt}: ${lastMsg}` }] }]
          });
          reply = resG.text || "";
        }
      } catch (_e) {}
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
