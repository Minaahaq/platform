export default function handler(req, res) {
  const ALLOWED_ORIGIN = "https://platform-sigma-seven.vercel.app";

  // ❌ امنع أي ميثود غير GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // 🛡️ تحقق من الـ Origin (مين اللي بيطلب التوكن)
  const origin = req.headers.origin;
  if (origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
  }

  // 🔑 تأكد إن السر موجود في البيئة
  const secret = process.env.CLIENT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "SERVER_SECRET_MISSING" });
  }

  // ⏳ صلاحية 5 دقائق
  const expires = Date.now() + 5 * 60 * 1000;

  // 🎫 إنشاء التوكن
  const token = Buffer.from(`${secret}:${expires}`).toString("base64");

  // ✨ السماح فقط لموقعك باستقبال الرد
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);

  return res.status(200).json({ token, expires });
}
