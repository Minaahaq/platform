import fetch from "node-fetch";
import { getSession } from "./get-token";

const rateLimit = new Map();

export default async function handler(req, res) {

  /* ====== TOKEN CHECK ====== */
  const token = req.headers["x-client-token"];
  const device = req.headers["x-device-id"];

  if (!token || !device) {
    return res.status(401).json({ error: "NO_TOKEN" });
  }

  const session = getSession(token);

  if (!session) {
    return res.status(403).json({ error: "INVALID_SESSION" });
  }

  if (session.device !== device) {
    return res.status(403).json({ error: "DEVICE_MISMATCH" });
  }

  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  if (session.ip !== ip) {
    return res.status(403).json({ error: "IP_CHANGED" });
  }

  /* ====== RATE LIMIT (TOKEN) ====== */
  const now = Date.now();
  const user = rateLimit.get(token) || { c: 0, t: now };

  if (now - user.t < 10000) {
    user.c++;
    if (user.c > 20) {
      return res.status(429).json({ error: "RATE_LIMIT" });
    }
  } else {
    user.c = 1;
    user.t = now;
  }

  rateLimit.set(token, user);

  /* ====== ROUTING ====== */
  const { type, yearId } = req.query;
  const BASE = "https://platform-sigma-seven.vercel.app";

  const routes = {
    years: `${BASE}/api/years`,
    subjects: `${BASE}/api/subjects?yearId=${yearId}`
  };

  if (!routes[type]) {
    return res.status(400).json({ error: "INVALID_TYPE" });
  }

  try {
    const r = await fetch(routes[type], {
      headers: {
        "x-api-key": process.env.API_KEY
      }
    });

    const data = await r.json();
    return res.json(data);

  } catch {
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
