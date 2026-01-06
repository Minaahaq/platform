export default async function handler(req, res) {
  const ALLOWED_ORIGINS = [
    "https://platform-sigma-seven.vercel.app"
  ];

  // ❌ GET فقط
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // 🎯 تحديد origin الحقيقي
  let origin = req.headers.origin || null;
  if (!origin && req.headers.referer) {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch {}
  }

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
  }

  // 🔐 التحقق من التوكن
  const token = req.headers["x-client-token"];
  if (!token) {
    return res.status(403).json({ error: "NO_TOKEN" });
  }

  let decoded;
  try {
    decoded = JSON.parse(
      Buffer.from(token, "base64").toString("utf8")
    );
  } catch {
    return res.status(403).json({ error: "BAD_TOKEN" });
  }

  const secret = process.env.CLIENT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "SERVER_SECRET_MISSING" });
  }

  // 🧾 إعادة احتساب التوقيع للتأكد من سلامة التوكن
  const expectedSig = Buffer.from(
    `${decoded.o}|${decoded.t}|${secret}`
  ).toString("base64");

  if (decoded.s !== expectedSig) {
    return res.status(403).json({ error: "SIGNATURE_INVALID" });
  }

  // 🛡️ التوكن مرتبط بنفس الدومين فقط
  if (decoded.o !== origin) {
    return res.status(403).json({ error: "ORIGIN_MISMATCH" });
  }

  // ⏳ انتهاء الصلاحية
  if (Date.now() > decoded.t) {
    return res.status(403).json({ error: "TOKEN_EXPIRED" });
  }

  // 🚫 منع Postman / curl / scrapers
  const ua = req.headers["user-agent"] || "";
  if (/curl|postman|python|node|fetch/i.test(ua)) {
    return res.status(403).json({ error: "BLOCKED_CLIENT" });
  }

  // ⚖️ Rate limit خفيف حسب الـ IP
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  const now = Date.now();
  if (!handler.requests) handler.requests = new Map();
  let list = handler.requests.get(ip) || [];
  list = list.filter(t => now - t < 30000);
  if (list.length >= 15) {
    return res.status(429).json({ error: "TOO_MANY_REQUESTS" });
  }
  list.push(now);
  handler.requests.set(ip, list);

  // 🌐 بناء الرابط الداخلي
  const { type, yearId, subjectId, teacherId, chapterId, lectureId } = req.query;
  const BASE_URL = "https://plus-teal.vercel.app";

  let url = "";
  if (type === "years") url = `${BASE_URL}/api/years`;
  else if (type === "subjects") url = `${BASE_URL}/api/subjects?yearId=${yearId}`;
  else if (type === "teachers") url = `${BASE_URL}/api/teachers?yearId=${yearId}&subjectId=${subjectId}`;
  else if (type === "chapters") url = `${BASE_URL}/api/chapters?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}`;
  else if (type === "lectures") url = `${BASE_URL}/api/lectures?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}`;
  else if (type === "videos") url = `${BASE_URL}/api/videos?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}&lectureId=${lectureId}`;
  else return res.status(400).json({ error: "INVALID_TYPE" });

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return res.status(500).json({ error: "NO_API_KEY" });

    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "User-Agent": "Secure-Proxy/1.0"
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: "UPSTREAM_ERROR" });
    }

    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).json(data);

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
