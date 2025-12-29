import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  const { yearId, subjectId, teacherId } = req.query;

  if (!yearId || !subjectId || !teacherId) {
    return res.status(400).json({ error: "yearId و subjectId و teacherId مطلوبان" });
  }

  try {
    const dataPath = path.join(process.cwd(), "data", "organized_output.json");
    const fileData = await fs.readFile(dataPath, "utf-8");
    const siteData = JSON.parse(fileData);

    const year = siteData.find(y => String(y.id) === String(yearId) || y.name === yearId);
    if (!year) return res.status(404).json({ error: "السنة غير موجودة" });

    const subject = year.subjects.find(s => String(s.id) === String(subjectId) || s.name === subjectId);
    if (!subject) return res.status(404).json({ error: "المادة غير موجودة" });

    const teacher = subject.teachers.find(t => String(t.id) === String(teacherId) || t.name === teacherId);
    if (!teacher) return res.status(404).json({ error: "المدرس غير موجود" });

    const chapters = teacher.chapters.map(c => ({
      id: c.id,
      name: c.name,
      videos_count: c.videos?.length || 0
    }));

    return res.status(200).json(chapters);
  } catch (err) {
    console.error("Error in /api/chapters:", err);
    return res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
}
