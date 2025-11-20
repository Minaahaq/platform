export default function handler(req, res) {
  // نقرأ المفتاح اللي جاي في الهيدر
  const secret = req.headers["x-api-key"];

  // لو المفتاح مش موجود أو غلط
  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // جلب البيانات
  const data = require("../data/coursatk_scraped_data.json");

  res.status(200).json({ data });
}
