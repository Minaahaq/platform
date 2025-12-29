const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// API Key بسيط للحماية
const API_KEY = process.env.API_KEY || "secret123";
function checkApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// استخدام Middleware للتحقق من المفتاح
app.use(checkApiKey);

// قراءة البيانات من فولدر data
const dataPath = path.join(__dirname, 'data', 'organized_output.json');
let rawData = fs.readFileSync(dataPath, 'utf-8');
let siteData = JSON.parse(rawData);

// 1. مسار لجلب المواد بناءً على السنة
app.get('/api/subjects/:yearId', (req, res) => {
  const year = siteData.find(y => y.year_id === req.params.yearId);
  res.json(year ? year.subjects : []);
});

// 2. مسار لجلب المدرسين بناءً على المادة والسنة
app.get('/api/teachers/:yearId/:subjectId', (req, res) => {
  const year = siteData.find(y => y.year_id === req.params.yearId);
  const subject = year?.subjects.find(s => s.subject_id === req.params.subjectId);
  res.json(subject ? subject.teachers : []);
});

// 3. مسار خاص لبيانات "مدرس معين"
app.get('/api/teacher/:teacherId', (req, res) => {
  let foundTeacher = null;
  siteData.forEach(year => {
    year.subjects.forEach(sub => {
      const teacher = sub.teachers.find(t => t.teacher_id === req.params.teacherId);
      if (teacher) foundTeacher = teacher;
    });
  });
  res.json(foundTeacher || { error: "المدرس غير موجود" });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API لـ THE BEST يعمل على بورت ${PORT}`));
