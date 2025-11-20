import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// مدة صلاحية التوقيع
const TOKEN_EXPIRY = 60; // 60 ثانية

// Rate Limit: عداد طلبات لكل IP
const requests = {};

export default async function handler(req, res) {
  const secret = process.env.SECRET_KEY;
  const site = process.env.SITE_URL;

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const ua = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  // =============================
  // 1️⃣ منع الزيارات من خارج موقعك
  // =============================
  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Forbidden Origin" });
  }

  // =============================
  // 2️⃣ منع البوتات والسكريبتات
  // =============================
  const blockedAgents = ["curl", "python", "wget", "node", "scraper", "bot"];
  if (blockedAgents.some(a => ua.toLowerCase().includes(a))) {
    return res.status(403).json({ error: "Blocked User-Agent" });
  }

  // =============================
  // 3️⃣ Rate Limit لكل IP
  // =============================
  const now = Date.now();
  if (!requests[ip]) requests[ip] = [];
  requests[ip] = requests[ip].filter(ts => now - ts < 60000); // آخر دقيقة

  if (requests[ip].length > 30) {
    return res.status(429).json({ error: "Too Many Requests" });
  }

  requests[ip].push(now);

  // =============================
  // 4️⃣ السيرفر يولّد التوقيع بنفسه
  // =============================
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `${ip}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");

  // =============================
  // 5️⃣ تحميل ملف JSON من السيرفر
  // =============================
  try {
    const filePath = path.join(process.cwd(), "data/coursatk_scraped_data.json");
    const jsonData = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(jsonData);

    res.status(200).json({
      ok: true,
      signature,
      timestamp,
      ip,
      data
    });

  } catch (err) {
    res.status(500).json({ error: "Server Error", details: err.message });
  }
}
