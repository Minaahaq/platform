// /pages/api/videos.js
import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  const { yearId, subjectId, teacherId, chapterId, lectureId } = req.query;

  if (!yearId || !subjectId || !teacherId || !chapterId || !lectureId) {
    return res.status(400).json({ error: "كل المعرفات مطلوبة" });
  }

  try {
    const dataPath = path.join(process.cwd(), "data", "organized_output.json");
    const fileData = await fs.readFile(dataPath, "utf-8");
    const siteData = JSON.parse(fileData);

    const year = siteData.find(y => String(y.id) === yearId);
    if (!year) return res.status(404).json({ error: "السنة غير موجودة" });

    const subject = year.subjects.find(s => String(s.id) === subjectId);
    if (!subject) return res.status(404).json({ error: "المادة غير موجودة" });

    const teacher = subject.teachers.find(t => String(t.id) === teacherId);
    if (!teacher) return res.status(404).json({ error: "المدرس غير موجود" });

    const chapter = teacher.chapters.find(c => String(c.id) === chapterId);
    if (!chapter) return res.status(404).json({ error: "الفصل غير موجود" });

    const lecture = (chapter.lectures || []).find(l => String(l.id) === lectureId);
    if (!lecture) return res.status(404).json({ error: "المحاضرة غير موجودة" });

    // هنا بنرجع بيانات الفيديو + صورة لكل فيديو (أو صورة الفصل كبديل)
    const videos = (lecture.videos || []).map(v => ({
      id: v.id,
      title: v.title,
      stream_url: v.stream_url,
      thumbnail: v.thumbnail || chapter.chapter_image_url || null
    }));

    return res.status(200).json({
      chapter_image_url: chapter.chapter_image_url || null,
      videos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
}
