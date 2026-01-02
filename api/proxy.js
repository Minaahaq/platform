import fetch from "node-fetch";

/* =====================
   🔒 CONFIG
===================== */
const ALLOWED_SITE = "https://platform-sigma-seven.vercel.app"; // ← غيّرها
const rateLimit = new Map();

/* =====================
   🚀 HANDLER
===================== */
export default async function handler(req, res) {

  /* =====================
     🔒 SITE ONLY (الأهم)
  ===================== */
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  if (
    !origin.startsWith(ALLOWED_SITE) &&
    !referer.startsWith(ALLOWED_SITE)
  ) {
    return res.status(403).json({ error: "SITE_ONLY" });
  }

  /* =====================
     🔒 METHOD CHECK
  ===================== */
  if (req.method !== "GET") {
    return res.status(405).json({ error: "NOT_ALLOWED" });
  }

  /* =====================
     🔒 RATE LIMIT (IP)
  ===================== */
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  const windowMs = 10 * 1000; // 10 ثواني
  const maxReq = 20;

  const user = rateLimit.get(ip) || { count: 0, time: now };

  if (now - user.time < windowMs) {
    user.count++;
    if (user.count > maxReq) {
      return res.status(429).json({ error: "TOO_MANY_REQUESTS" });
    }
  } else {
    user.count = 1;
    user.time = now;
  }

  rateLimit.set(ip, user);

  /* =====================
     📦 PROXY LOGIC
  ===================== */
  const {
    type,
    yearId,
    subjectId,
    teacherId,
    chapterId,
    lectureId
  } = req.query;

  const BASE_URL = "https://platform-sigma-seven.vercel.app";
  let url = "";

  if (type === "years") {
    url = `${BASE_URL}/api/years`;
  } else if (type === "subjects") {
    url = `${BASE_URL}/api/subjects?yearId=${yearId}`;
  } else if (type === "teachers") {
    url = `${BASE_URL}/api/teachers?yearId=${yearId}&subjectId=${subjectId}`;
  } else if (type === "chapters") {
    url = `${BASE_URL}/api/chapters?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}`;
  } else if (type === "lectures") {
    url = `${BASE_URL}/api/lectures?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}`;
  } else if (type === "videos") {
    url = `${BASE_URL}/api/videos?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}&lectureId=${lectureId}`;
  } else {
    return res.status(400).json({ error: "INVALID_TYPE" });
  }

  /* =====================
     🔁 FETCH DATA
  ===================== */
  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.API_KEY, // 🔒 سري – في السيرفر بس
        "User-Agent": "Secure-Proxy/1.0"
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: "UPSTREAM_ERROR" });
    }

    const data = await response.json();

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);

  } catch (err) {
    console.error("Proxy Error:", err.message);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
        }
