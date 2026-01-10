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
  if (!SECRET) {
    return res.status(500).json({ error: "NO_SECRET" });
  }

  const ua = req.headers["user-agent"] || "";

  // السماح فقط للتطبيق أو WebView
  if (!(/AppCreator24|wv|WebView/i.test(ua))) {
    return res.status(403).json({ error: "APP_ONLY" });
  }

  // ===== فحص Session حالية =====
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/session=([^;]+)/);

  if (match) {
    try {
      const existing = JSON.parse(
        Buffer.from(match[1], "base64").toString("utf-8")
      );

      if (
        existing?.payload?.c === code &&
        existing?.payload?.d === device
      ) {
        return res.status(200).json({
          ok: true,
          message: "SESSION_ALREADY_EXISTS"
        });
      }
    } catch (e) {}
  }

  // ===== Payload بدون IP =====
  const payload = {
    c: code,        // كود الاشتراك
    d: device,      // بصمة الجهاز
    ua,             // User-Agent
    t: Date.now(),  // وقت الإنشاء
  };

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  const session = Buffer
    .from(JSON.stringify({ payload, sig }))
    .toString("base64");

  res.setHeader("Set-Cookie", [
    `session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  ]);

  return res.status(200).json({
    ok: true,
    message: "SESSION_CREATED"
  });
}
