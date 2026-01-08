import fs from "fs/promises";
import path from "path";

const PLATFORM_NAME = "الثانوية بلس";

// 👈 حط الموقعين هنا
const ALLOWED_DOMAINS = [
  "https://platform-sigma-seven.vercel.app",
  "https://plus-teal.vercel.app"
];

// تحقق من الدومين
function isAllowed(req) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  return ALLOWED_DOMAINS.some(domain =>
    origin.includes(domain) || referer.includes(domain)
  );
}

// داتا مزورة لغير المسموح
function fakeSubjects() {
  return [
    {
      id: 999,
      name: "غير مصرح بالوصول | الثانوية بلس",
      teachers_count: 0,
      powered_by: PLATFORM_NAME
    }
  ];
}

export default async function handler(req, res) {
  const yearId = req.query.yearId;
  if (!yearId) return res.status(400).json({ error: "yearId مطلوب" });

  // 👈 لو مش من الموقعين
  if (!isAllowed(req)) {
    return res.status(200).json(fakeSubjects());
  }

  try {
    const dataPath = path.join(process.cwd(), "data", "organized_output.json");
    const fileData = await fs.readFile(dataPath, "utf-8");
    const siteData = JSON.parse(fileData);

    const year = siteData.find(
      y => String(y.id) === String(yearId) || y.name === yearId
    );
    if (!year) return res.status(404).json({ error: "السنة غير موجودة" });

    const subjects = year.subjects.map(subject => ({
      id: subject.id,
      name: `${subject.name} | ${PLATFORM_NAME}`,
      original_name: subject.name,
      teachers_count: subject.teachers?.length || 0,
      powered_by: PLATFORM_NAME
    }));

    return res.status(200).json(subjects);
  } catch (err) {
    return res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
}
