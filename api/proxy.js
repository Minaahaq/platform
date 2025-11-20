import crypto from "crypto";

export default async function handler(req, res) {
  const site = process.env.SITE_URL;
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Access Forbidden" });
  }

  // توقيع مؤقت لكل طلب
  const clientSignature = req.headers["x-signature"];
  const ts = Number(req.headers["x-timestamp"]);

  // التأكد أن التوقيت قريب من الوقت الحالي (5 ثواني)
  if (!clientSignature || !ts || Math.abs(Date.now()/1000 - ts) > 5) {
    return res.status(403).json({ error: "Invalid request" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.SECRET_KEY)
    .update(`secure-access-${ts}`)
    .digest("hex");

  if (clientSignature !== expectedSignature) {
    return res.status(403).json({ error: "Invalid signature" });
  }

  try {
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    const result = await response.json();
    const data = result.data || result;

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
      }
