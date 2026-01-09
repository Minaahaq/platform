import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const { code, device } = req.body || {};
  if (!code || !device) {
    return res.status(400).json({ error: "MISSING_DATA" });
  }

  const SECRET = process.env.SESSION_SECRET;
  if (!SECRET) return res.status(500).json({ error: "NO_SECRET" });

  const ua = req.headers["user-agent"] || "";

  // ✅ السماح فقط للتطبيق أو WebView (اختياري)
  if (!(/AppCreator24|wv|WebView/i.test(ua))) {
    return res.status(403).json({ error: "APP_ONLY" });
  }

  // ===== توليد payload جديد للجلسة =====
  const payload = {
    c: code,                    // الكود
    d: device,                  // الجهاز الحالي
    i: req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress,
    ua,                         // الـ user-agent
    t: Date.now(),               // وقت توليد الجلسة
    renewed: true                // علامة على تجديد الجلسة
  };

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  const session = Buffer.from(JSON.stringify({ payload, sig })).toString("base64");

  // ✅ جلسة لمدة شهر (30 يوم)
  res.setHeader("Set-Cookie", [
    `session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  ]);

  return res.status(200).json({ ok: true, message: "SESSION_CREATED" });
}
