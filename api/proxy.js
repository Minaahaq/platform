// pages/api/proxy.js
import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const ts = Math.floor(Date.now() / 1000);

    // حساب التوقيع على السيرفر فقط
    const signature = crypto
      .createHmac("sha256", process.env.CLIENT_SECRET_KEY)
      .update(`secure-access-${ts}`)
      .digest("hex");

    // جلب البيانات من API الداخلي
    const apiRes = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.CLIENT_SECRET_KEY,
        "x-timestamp": ts,
        "x-signature": signature
      }
    });

    const data = await apiRes.json();
    res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Proxy Error", details: err.message });
  }
}
