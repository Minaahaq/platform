import crypto from "crypto";

export default async function handler(req, res) {
  const site = process.env.SITE_URL;

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  // السماح فقط لموقعك
  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Access Forbidden (Origin)" });
  }

  try {
    // 🔥 هنا السيرفر (proxy) بيبعت INTERNAL_KEY تلقائي
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY,
        "x-internal-key": process.env.INTERNAL_KEY   // ←← مفيش جافاسكريبت
      }
    });

    const encrypted = await response.json();

    // فك تشفير AES
    const key = Buffer.from(process.env.DATA_KEY, "hex");
    const iv = Buffer.from(encrypted.iv, "hex");
    const encryptedData = Buffer.from(encrypted.data, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedData, null, "utf8");
    decrypted += decipher.final("utf8");

    const jsonData = JSON.parse(decrypted);

    res.status(200).json(jsonData);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
