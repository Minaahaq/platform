import crypto from "crypto";

export default async function handler(req, res) {
  const site = process.env.SITE_URL;
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const clientKey = req.headers["x-internal-key"]; // المفتاح القادم من البراوزر

  // ========== توليد المفتاح الديناميكي ==========
  const staticKey = process.env.INTERNAL_KEY; // مفتاح ثابت سري
  const currentMinute = Math.floor(Date.now() / 60000); // كل دقيقة
  const dynamicKey = crypto
    .createHmac("sha256", staticKey)
    .update(String(currentMinute))
    .digest("hex");

  // ========== حماية Origin ==========
  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Access Forbidden (Origin)" });
  }

  // ========== حماية المفتاح الديناميكي ==========
  if (clientKey !== dynamicKey) {
    return res.status(403).json({ error: "Access Forbidden (Dynamic Key)" });
  }

  try {
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    const encrypted = await response.json();

    // ======= فك التشفير AES =======
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
