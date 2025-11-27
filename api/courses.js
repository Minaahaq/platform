import crypto from "crypto";

export default async function handler(req, res) {
  // ============================
  // 🔥 منع الـ VPN و الـ Proxy
  // ============================
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;

  try {
    const vpnCheck = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting`);
    const info = await vpnCheck.json();

    if (info.proxy || info.hosting) {
      return res.status(403).json({ error: "VPN Not Allowed" });
    }
  } catch (err) {
    return res.status(403).json({ error: "VPN Check Failed" });
  }

  // ============================
  // 🔥 السماح للسيرفر الداخلي فقط
  // ============================
  if (!req.headers["x-vercel-proxy-signature"]) {
    return res.status(403).json({ error: "Internal Server Only" });
  }

  // ============================
  // 🔥 حماية WebView للتطبيق
  // ============================
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  if (!ua.includes("apkrito") && !ua.includes("wv") && !ua.includes("webview")) {
    return res.status(403).json({ error: "App Only Access" });
  }

  // ============================
  // 🔥 التحقق من signature
  // ============================
  const signature = req.headers["x-signature"];
  if (!signature) {
    return res.status(403).json({ error: "No signature" });
  }

  try {
    atob(signature); // التأكد أنها Base64 صحيحة
  } catch {
    return res.status(403).json({ error: "Invalid signature" });
  }

  // ============================
  // 🔥 التحقق من مفتاح الـ API
  // ============================
  const secret = req.headers["x-api-key"];
  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ============================
  // 🔥 جلب البيانات وتشفير AES
  // ============================
  const data = require("../data/coursatk_scraped_data.json");
  const key = Buffer.from(process.env.DATA_KEY, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  // ============================
  // 🔥 إرسال البيانات المشفرة مع IV
  // ============================
  res.status(200).json({
    iv: iv.toString("hex"),
    data: encrypted
  });
}
