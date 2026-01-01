import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  // 🔒 حماية APK فقط
  if (!req.headers["user-agent"]?.includes("FullMarkApp")) {
    return res.status(403).json({ error: "APP_ONLY" });
  }

  try {
    const dataPath = path.join(process.cwd(), "data", "organized_output.json");
    const fileData = await fs.readFile(dataPath, "utf-8");
    const siteData = JSON.parse(fileData);

    const years = siteData.map(y => ({
      id: y.id,
      name: y.name,
      image_url: y.image_url,
      subjects_count: y.subjects?.length || 0
    }));

    res.status(200).json(years);
  } catch (err) {
    console.error("Error in /api/years:", err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
}
