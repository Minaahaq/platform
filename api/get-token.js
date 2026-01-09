import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const ua = req.headers["user-agent"] || "";

  // ❌ منع أي سكريبتات أو أوامر
  if (/curl|postman|python|wget|httpclient|axios|node-fetch/i.test(ua)) {
    return res.status(403).json({ error: "BLOCKED_CLIENT" });
  }


  const { code, device } = req.body || {};
  if (!code || !device) {
    return res.status(400).json({ error: "MISSING_DATA" });
  }

  const SECRET = process.env.SESSION_SECRET;
  if (!SECRET) return res.status(500).json({ error: "NO_SECRET" });

  const payload = {
    c: code,
    d: device,
    i: req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress,
    ua,
    t: Date.now(),
    app: "APK_CREATOR_ONLY" // 🔥 علامة تثبيت
  };

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  const session = Buffer
    .from(JSON.stringify({ payload, sig }))
    .toString("base64");

  // ✅ جلسة 30 دقيقة فقط
  res.setHeader("Set-Cookie", [
    `session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  ]);

  return res.status(200).json({ ok: true });
}
