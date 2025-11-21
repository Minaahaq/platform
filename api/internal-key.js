import crypto from "crypto";

export default function handler(req, res) {
  const site = process.env.SITE_URL;
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  // السماح فقط للموقع الأصلي
  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // المفتاح الثابت في env
  const staticKey = process.env.INTERNAL_KEY;

  // المفتاح الديناميكي - يتغير كل دقيقة
  const currentMinute = Math.floor(Date.now() / 60000);
  const dynamicKey = crypto
    .createHmac("sha256", staticKey)
    .update(String(currentMinute))
    .digest("hex");

  // إرسال المفتاح الديناميكي للفرونت
  res.status(200).json({ key: dynamicKey });
}
