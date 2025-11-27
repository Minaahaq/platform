import crypto from "crypto";

export default async function handler(req, res) {

 // ============================
// 🔥 منع الـ VPN و الـ Proxy
// ============================
const ip =
  req.headers["x-forwarded-for"]?.split(",")[0] ||
  req.connection.remoteAddress;

try {
  const vpnCheck = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting`);
  const info = await vpnCheck.json();

  // لو IP من VPN او Proxy او Hosting Server
  if (info.proxy || info.hosting) {
    return res.status(403).json({ error: "VPN Not Allowed" });
  }
} catch (err) {
  // fallback: لو API عطلت → امنع
  return res.status(403).json({ error: "VPN Check Failed" });
}
 

  // ============================
  // 🔥 حماية: السيرفر الداخلي فقط
  // ============================
  if (!req.headers["x-vercel-proxy-signature"]) {
    return res.status(403).json({ error: "Internal Server Only" });
  }

  // ============================
  // 🔥 حماية WebView التطبيق
  // ============================
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  if (
    !ua.includes("apkrito") &&
    !ua.includes("wv") &&
    !ua.includes("webview")
  ) {
    return res.status(403).json({ error: "App Only Access" });
  }

  // ============================
  // 🔥 التحقق من البصمة
  // ============================
  const signature = req.headers["x-signature"];

  if (!signature) {
    return res.status(403).json({ error: "No signature" });
  }

  // لازم تكون Base64
  try {
    atob(signature);
  } catch {
    return res.status(403).json({ error: "Invalid signature" });
  }

  // ============================
  // 🔥 جلب الداتا من API المشفر
  // ============================
  try {
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Courses API Error" });
    }

    const encrypted = await response.json();

    // ============================
    // 🔥 فك تشفير AES
    // ============================
    const key = Buffer.from(process.env.DATA_KEY, "hex");
    const iv = Buffer.from(encrypted.iv, "hex");
    const encryptedData = Buffer.from(encrypted.data, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedData, null, "utf8");
    decrypted += decipher.final("utf8");

    const jsonData = JSON.parse(decrypted);

    // ============================
    // 🔥 رجّع الداتا للتطبيق
    // ============================
    res.status(200).json(jsonData);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
