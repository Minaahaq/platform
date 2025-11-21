import crypto from "crypto";

export default async function handler(req, res) {
  const site = process.env.SITE_URL;

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const ua = req.headers["user-agent"] || "";

  // ============ 🔒 منع السكربتات الخارجية ============
  // 1 - منع غياب ORIGIN / REFERER
  if (!origin || !referer) {
    return res.status(403).json({ error: "Blocked: No browser headers" });
  }

  // 2 - لازم يكونوا نفس موقعك
  if (!origin.startsWith(site) || !referer.startsWith(site)) {
    return res.status(403).json({ error: "Access Forbidden (Origin)" });
  }

  // 3 - منع Python / Curl / Postman / Node scripts
  if (
    ua.includes("python") ||
    ua.includes("curl") ||
    ua.includes("wget") ||
    ua.includes("httpclient") ||
    ua.includes("Postman") ||
    ua.includes("axios") ||
    ua.includes("node")
  ) {
    return res.status(403).json({ error: "Blocked: Script user-agent" });
  }
  // ===================================================

  try {
    // 🔥 هنا السيرفر (proxy) بيبعت INTERNAL_KEY تلقائي
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY,
        "x-internal-key": process.env.INTERNAL_KEY
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
