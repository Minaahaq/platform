import fs from "fs/promises";
import path from "path";

const PLATFORM_NAME = "الثانوية بلس";

export default async function handler(req, res) {
  const yearId = req.query.yearId;
  if (!yearId) return res.status(400).json({ error: "yearId مطلوب" });

  try {
    const dataPath = path.join(process.cwd(), "data", "organized_output.json");
    const fileData = await fs.readFile(dataPath, "utf-8");
    const siteData = JSON.parse(fileData);

    const year = siteData.find(
      y => String(y.id) === String(yearId) || y.name === yearId
    );
    if (!year) return res.status(404).json({ error: "السنة غير موجودة" });

    const subjects = year.subjects.map(subject => {
      const brandedName = subject.name.includes(PLATFORM_NAME)
        ? subject.name
        : `${subject.name} | ${PLATFORM_NAME}`;

      return {
        id: subject.id,
        name: brandedName,                // 👈 الاسم بعد الإضافة
        original_name: subject.name,      // 👈 اختياري للتتبع
        teachers_count: subject.teachers?.length || 0,
        powered_by: PLATFORM_NAME         // 👈 علامة إجبارية
      };
    });

    return res.status(200).json(subjects);
  } catch (err) {
    console.error("Error in /api/subjects:", err);
    return res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
             }
