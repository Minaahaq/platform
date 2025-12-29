import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  const { yearId, subjectId } = req.query;

  if (!yearId || !subjectId) {
    return res.status(400).json({ error: "yearId و subjectId مطلوبان" });
  }

  try {
    const dataPath = path.join(process.cwd(), "data", "organized_output.json");
    const fileData = await fs.readFile(dataPath, "utf-8");
    const siteData = JSON.parse(fileData);

    const year = siteData.find(y => String(y.id) === String(yearId) || y.name === yearId);
    if (!year) return res.status(404).json({ error: "السنة غير موجودة" });

    const subject = year.subjects.find(s => String(s.id) === String(subjectId) || s.name === subjectId);
    if (!subject) return res.status(404).json({ error: "المادة غير موجودة" });

    const teachers = subject.teachers.map(t => ({
      id: t.id,
      name: t.name,
      image_url: t.image_url || null,
      chapters_count: t.chapters?.length || 0
    }));

    return res.status(200).json(teachers);
  } catch (err) {
    console.error("Error in /api/teachers:", err);
    return res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
}
