import crypto from "crypto";

export default async function handler(req, res) {
  const site = process.env.SITE_URL;
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  // تحقق من المصدر
  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Access Forbidden: Invalid origin or referer" });
  }

  // قراءة توقيع العميل وtimestamp
  const clientSignature = req.headers["x-signature"];
  const ts = Number(req.headers["x-timestamp"]);

  if (!clientSignature || !ts) {
    return res.status(403).json({ error: "Missing signature or timestamp" });
  }

  // تحقق من أن التوقيت قريب من الوقت الحالي (10 ثواني)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 10) {
    return res.status(403).json({ error: "Timestamp too old or too new" });
  }

  // حساب التوقيع المتوقع
  const expectedSignature = crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(`secure-access-${ts}`)
    .digest("hex");

  if (clientSignature !== expectedSignature) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  try {
    // جلب البيانات من API الداخلي
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch internal API" });
    }

    const result = await response.json();
    const data = result.data || result;

    res.status(200).json({ data });
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
