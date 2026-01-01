import fetch from "node-fetch";

// Rate limit لكل IP
const rateLimit = new Map();
const activeTokens = {}; // لتخزين IP لكل توكن

export default async function handler(req, res) {

  /* =====================
     🔒 BASIC SECURITY
  ===================== */

  // السماح بـ GET فقط
  if (req.method !== "GET") {
    return res.status(405).json({ error: "NOT_ALLOWED" });
  }

  // فحص Dynamic Token من الفرونت
  const token = req.headers["x-client-token"];
  if (!token || token !== process.env.CLIENT_SECRET) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  // 🔐 ربط التوكن بالـ IP
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  if (!activeTokens[token]) activeTokens[token] = ip;
  if (activeTokens[token] !== ip) {
    return res.status(403).json({ error: "IP_MISMATCH" });
  }

  // فحص origin/referer
  const referer = req.headers.referer || "";
  if (!referer.includes("https://platform-sigma-seven.vercel.app")) {
    return res.status(403).json({ error: "BAD_ORIGIN" });
  }

  // Rate limit (20 طلب / 10 ثواني)
  const now = Date.now();
  const windowMs = 10 * 1000;
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
     📦 FETCH ORIGINAL DATA
  ===================== */

  const { type, yearId, subjectId, teacherId, chapterId, lectureId } = req.query;
  const BASE_URL = "https://platform-sigma-seven.vercel.app";

  let url = "";
  if (type === "years") url = `${BASE_URL}/api/years`;
  else if (type === "subjects") url = `${BASE_URL}/api/subjects?yearId=${yearId}`;
  else if (type === "teachers") url = `${BASE_URL}/api/teachers?yearId=${yearId}&subjectId=${subjectId}`;
  else if (type === "chapters") url = `${BASE_URL}/api/chapters?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}`;
  else if (type === "lectures") url = `${BASE_URL}/api/lectures?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}`;
  else if (type === "videos") url = `${BASE_URL}/api/videos?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}&lectureId=${lectureId}`;
  else return res.status(400).json({ error: "INVALID_TYPE" });

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": process.env.API_KEY,
        "x-internal-secret": process.env.INTERNAL_SECRET,
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
