import crypto from "crypto";

export default function handler(req, res) {

  const ALLOWED_ORIGINS = ["https://platform-sigma-seven.vercel.app"];

  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // ========== origin check ==========
  let origin = req.headers.origin || null;
  if (!origin && req.headers.referer) {
    try { origin = new URL(req.headers.referer).origin; } catch {}
  }
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
  }

  // ========== session + device binding ==========
  const ua = req.headers["user-agent"] || "";
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "0.0.0.0";

  // منع curl / postman / bots
  if (/curl|python|postman|wget|httpclient/i.test(ua)) {
    return res.status(403).json({ error: "BLOCKED_CLIENT" });
  }

  const deviceHash = crypto
    .createHash("sha256")
    .update(ua + "|" + ip)
    .digest("hex");

  const secret = process.env.CLIENT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "SERVER_SECRET_MISSING" });
  }

  const expires = Date.now() + 60 * 1000; // صلاحية 60 ثانية فقط

  const payload = {
    o: origin,
    t: expires,
    d: deviceHash,      // الجهاز المرتبط بالتوكن
    sid: crypto.randomUUID()
  };

  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${payload.o}|${payload.t}|${payload.d}|${payload.sid}`)
    .digest("hex");

  const token = Buffer
    .from(JSON.stringify({ ...payload, s: sig }))
    .toString("base64");

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.status(200).json({ token, expires });
}
