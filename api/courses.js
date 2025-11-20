import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // ⚠ المسار الصحيح حسب بنية مجلداتك
  const filePath = path.join(__dirname, "../data/coursatk_scraped_data.json");

  try {
    const jsonData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(jsonData);

    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ error: "Read Error", details: err.message });
  }
}
