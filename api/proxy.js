import crypto from "crypto";

const TOKEN_EXPIRY = 60; // ثواني
const USED_NONCES = new Set();
const RATE_LIMIT = new Map(); // لكل IP

// السماح فقط بموقعك الحقيقي
const allowedOrigins = [process.env.SITE_URL];

export default async function handler(req, res) {
  const secret = process.env.SECRET_KEY;
  const site = process.env.SITE_URL;

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const ua = req.headers["user-agent"] || "";

  const clientToken = req.headers["x-signature"];
  const clientTimestamp = req.headers["x-timestamp"];
  const clientNonce = req.headers["x-nonce"];
  const captchaToken = req.headers["x-captcha"]; // reCaptcha v3

  // 1️⃣ أصل الطلب (Origin / Referer)
  if (
    !allowedOrigins.includes(origin) &&
    !allowedOrigins.some((o) => referer.startsWith(o))
  ) {
    return res.status(403).json({ error: "Forbidden Origin" });
  }

  // 2️⃣ منع الوصول من سكريبتات بدون متصفح
  if (!ua || ua.length < 20 || ua.includes("curl") || ua.includes("python")) {
    return res.status(403).json({ error: "Invalid User-Agent" });
  }

  // 3️⃣ Rate Limiting
  const nowMs = Date.now();
  const userRate = RATE_LIMIT.get(ip) || { count: 0, time: nowMs };

  if (nowMs - userRate.time < 1000) {
    if (userRate.count > 20) return res.status(429).json({ error: "Slow Down" });
    userRate.count++;
  } else {
    userRate.count = 1;
    userRate.time = nowMs;
  }

  RATE_LIMIT.set(ip, userRate);

  // 4️⃣ CAPTCHA للتحقق إن العميل إنسان
  try {
    const verify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`,
      { method: "POST" }
    ).then((r) => r.json());

    if (!verify.success || verify.score < 0.5) {
      return res.status(403).json({ error: "Bot Detected" });
    }
  } catch (e) {
    return res.status(403).json({ error: "Captcha Failed" });
  }

  // 5️⃣ التوكن + الوقت + النونس
  if (!clientToken || !clientTimestamp || !clientNonce) {
    return res
      .status(403)
      .json({ error: "Missing Signature, Timestamp or Nonce" });
  }

  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(clientTimestamp, 10);

  if (Math.abs(now - ts) > TOKEN_EXPIRY) {
    return res.status(403).json({ error: "Expired Token" });
  }

  // 6️⃣ منع إعادة استخدام النونس
  if (USED_NONCES.has(clientNonce)) {
    return res.status(403).json({ error: "Nonce Already Used" });
  }
  USED_NONCES.add(clientNonce);
  setTimeout(() => USED_NONCES.delete(clientNonce), TOKEN_EXPIRY * 1000);

  // 7️⃣ بناء التوقيع الحقيقي
  const serverToken = crypto
    .createHmac("sha256", secret)
    .update(`${clientNonce}:${ts}:${ip}`)
    .digest("hex");

  if (clientToken !== serverToken) {
    return res.status(403).json({ error: "Invalid Token" });
  }

  // 8️⃣ جلب البيانات الأصلية
  try {
    const response = await fetch(`${site}/api/courses`, {
      headers: { "x-api-key": secret },
      timeout: 5000,
    });

    const result = await response.json();
    res.status(200).json(result.data || result);
  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
