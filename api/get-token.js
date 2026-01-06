export default function handler(req, res) {
  const ALLOWED_ORIGINS = [
    "https://platform-sigma-seven.vercel.app"
  ];

  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // حاول نجيب origin ولو مش موجود نستخدم referer
  let origin = req.headers.origin || null;

  if (!origin && req.headers.referer) {
    try {
      origin = new URL(req.headers.referer).origin;
    } catch {}
  }

  console.log("Detected origin =>", origin);

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
  }

  const secret = process.env.CLIENT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "SERVER_SECRET_MISSING" });
  }

  const expires = Date.now() + 5 * 60 * 1000;
  const token = Buffer.from(`${secret}:${expires}`).toString("base64");

  res.setHeader("Access-Control-Allow-Origin", origin);

  return res.status(200).json({ token, expires });
}
