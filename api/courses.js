import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // السماح فقط للـ Proxy الداخلي في Vercel
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // مسار الملف داخل السيرفر (غير مكشوف على الإنترنت)
  const filePath = path.join(process.cwd(), "data", "coursatk_scraped_data.json");

  try {
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);

    res.status(200).json({ data });

  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error.message });
  }
}

