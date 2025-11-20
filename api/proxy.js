// pages/api/proxy.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    // الاتصال بالـ API الداخلي مباشرة من السيرفر
    const internalRes = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    if (!internalRes.ok) {
      return res.status(500).json({ error: "Internal API Error" });
    }

    const result = await internalRes.json();
    const data = result.data || result;

    // إرسال البيانات للعميل
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
