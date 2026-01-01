import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  // 🔒 APP ONLY CHECK
  const ua = req.headers["user-agent"] || "";
  if (
    !ua.includes("AppCreator24") &&
    !ua.includes("wv") &&
    !ua.includes("WebView")
  ) {
    return res.status(403).json({ error: "APP_ONLY" });
  }
  const yearId = req.query.yearId;
  if (!yearId) return res.status(400).json({ error: "yearId مطلوب" });

  try {
    const dataPath = path.join(process.cwd(), "data", "organized_output.json");
    const fileData = await fs.readFile(dataPath, "utf-8");
    const siteData = JSON.parse(fileData);

    const year = siteData.find(y => String(y.id) === String(yearId) || y.name === yearId);
    if (!year) return res.status(404).json({ error: "السنة غير موجودة" });

    const subjects = year.subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      teachers_count: subject.teachers?.length || 0
    }));

    return res.status(200).json(subjects);
  } catch (err) {
    console.error("Error in /api/subjects:", err);
    return res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
}
