import crypto from "crypto";

export default function handler(req, res) {

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


  // السماح للسيرفر الداخلي فقط
  if (!req.headers["x-vercel-proxy-signature"]) {
    return res.status(403).json({ error: "Internal Server Only" });
  }

  // التحقق من المفتاح
  const secret = req.headers["x-api-key"];
  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // جلب البيانات
  const data = require("../data/coursatk_scraped_data.json");

  // التشفير AES
  const key = Buffer.from(process.env.DATA_KEY, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  res.status(200).json({
    iv: iv.toString("hex"),
    data: encrypted
  });
}
