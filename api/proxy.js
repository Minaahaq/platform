export default async function handler(req, res) {
  const site = process.env.SITE_URL; // رابط موقعك
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  // حماية: السماح فقط للطلبات من موقعك
  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Access Forbidden" });
  }

  // تحقق من مفتاح API (اختياري زيادة حماية)
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Invalid API Key" });
  }

  try {
    // جلب البيانات من API الداخلي
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch data" });
    }

    const result = await response.json();

    // استخراج البيانات بشكل آمن
    const data = result.data || result;

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
