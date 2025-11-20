import fs from "fs";
import path from "path";

export default function handler(req, res) {
  // ==========================
  // 1) التحقق من المفتاح السري
  // ==========================
  const secret = req.headers["x-api-key"];
  if (!secret || secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid API Key" });
  }

  // ==========================
  // 2) السماح فقط لموقعك
  // ==========================
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const allowed = process.env.SITE_URL;

  if (
    (!origin || !origin.startsWith(allowed)) &&
    (!referer || !referer.startsWith(allowed))
  ) {
    return res.status(403).json({ error: "Forbidden: Origin not allowed" });
  }

  // ==========================
  // 3) الغاء GET نهائياً
  // ==========================
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST only" });
  }

  try {
    // ==========================
    // 4) نفس المسار بالضبط
    // ==========================
    const filePath = path.join(process.cwd(), "date", "coursatk_scraped_data.json");

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: "Data file not found" });
    }

    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    return res.status(200).json({ data: jsonData });

  } catch (error) {
    return res.status(500).json({
      error: "Server Error",
      details: error.message
    });
  }
}
