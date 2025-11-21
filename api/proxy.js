import crypto from "crypto";

export default async function handler(req, res) {

  const ua = req.headers["user-agent"] || "";

  // السماح فقط للطلبات من WebView أبكريتو
  if (!ua.toLowerCase().includes("apkrito")) {
    return res.status(403).json({ error: "App Only Access" });
  }

  try {
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY,
        "x-internal-key": process.env.INTERNAL_KEY
      }
    });

    const encrypted = await response.json();

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
