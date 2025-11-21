import crypto from "crypto";

export default function handler(req, res) {
  const secret = req.headers["x-api-key"];

  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // جلب البيانات الأصلية
  const data = require("../data/coursatk_scraped_data.json");

  // ======= التشفير AES =======
  const key = Buffer.from(process.env.DATA_KEY, "hex");
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  // نرجع الداتا مشفّرة
  res.status(200).json({
    iv: iv.toString("hex"),
    data: encrypted
  });
}
