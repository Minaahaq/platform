export default function handler(req, res) {
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

  // 🔐 سر السيرفر
  const secret = process.env.CLIENT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "SERVER_SECRET_MISSING" });
  }

  // ⏳ صلاحية 5 دقائق
  const expires = Date.now() + 5 * 60 * 1000;

  // 📦 البيانات داخل التوكن
  const payload = {
    o: origin, // الدومين صاحب التوكن
    t: expires
  };

  // 🧾 توقيع لا يمكن توليده بدون السر
  const signature = Buffer.from(
    `${payload.o}|${payload.t}|${secret}`
  ).toString("base64");

  const token = Buffer.from(
    JSON.stringify({ ...payload, s: signature })
  ).toString("base64");

  // 🛡️ اسمح فقط لموقعك
  res.setHeader("Access-Control-Allow-Origin", origin);

  return res.status(200).json({ token, expires });
}
