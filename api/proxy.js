import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

export default async function handler(req, res) {
  // ============================
  // 🔥 منع الـ VPN و الـ Proxy
  // ============================
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection.remoteAddress;

  try {
    const vpnCheck = await fetch(`https://ip-api.com/json/${ip}?fields=proxy,hosting`);
    const info = await vpnCheck.json();

    if (info.proxy || info.hosting) {
      return res.status(403).json({ error: "VPN/Proxy Not Allowed" });
    }
  } catch (err) {
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
  if (!ua.includes("apkrito") && !ua.includes("wv") && !ua.includes("webview")) {
    return res.status(403).json({ error: "App Only Access" });
  }

  // ============================
  // 🔥 التحقق من البصمة Base64
  // ============================
  const signature = req.headers["x-signature"];
  if (!signature) return res.status(403).json({ error: "No signature" });

  try {
    Buffer.from(signature, "base64"); // أفضل من atob في Node
  } catch {
    return res.status(403).json({ error: "Invalid signature" });
  }

  // ============================
  // 🔥 جلب البيانات من Backblaze B2 مباشرة
  // ============================
  try {
    const client = new S3Client({
      region: "auto",
      endpoint: process.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: "coursatk_scraped_data.json",
    });

    const response = await client.send(command);
    const body = await response.Body.transformToString();
    const jsonData = JSON.parse(body);

    // ============================
    // 🔥 تشفير AES قبل الرجوع للعميل
    // ============================
    const key = Buffer.from(process.env.DATA_KEY, "hex");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(JSON.stringify(jsonData), "utf8", "hex");
    encrypted += cipher.final("hex");

    res.status(200).json({
      iv: iv.toString("hex"),
      data: encrypted,
    });
  } catch (err) {
    res.status(500).json({ error: "Backblaze API Error", details: err.message });
  }
}
