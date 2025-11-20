import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // نقرأ المفتاح اللي جاي في الهيدر
  const secret = req.headers["x-api-key"];

  // لو المفتاح مش موجود أو غلط
  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // جلب البيانات
  try {
    const filePath = path.join(process.cwd(), "data/coursatk_scraped_data.json");
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ error: "Read Error", details: err.message });
  }
}
