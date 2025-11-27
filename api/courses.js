import crypto from "crypto";

export default function handler(req, res) {


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
