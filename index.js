const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// 🔐 المفتاح السري من Environment Variable
const API_KEY = process.env.API_KEY;

function checkApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}
app.use(checkApiKey);

// قراءة بيانات JSON
const dataPath = path.join(__dirname, 'data', 'organized_output.json');
let siteData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 1️⃣ كل السنوات
app.get('/api/years', (req, res) => {
  const years = siteData.map(y => ({
    year_id: y.id,
    name: y.name,
    image_url: y.image_url,
    subjects_count: y.subjects?.length || 0
  }));
  res.json(years);
});

// 2️⃣ المواد حسب السنة
app.get('/api/subjects/:yearId', (req, res) => {
  const year = siteData.find(y => y.id == req.params.yearId);
  res.json(year ? year.subjects : []);
});

// 3️⃣ المدرسين حسب المادة والسنة
app.get('/api/teachers/:yearId/:subjectId', (req, res) => {
  const year = siteData.find(y => y.id == req.params.yearId);
  const subject = year?.subjects.find(s => s.id == req.params.subjectId);
  res.json(subject ? subject.teachers : []);
});

// 4️⃣ بيانات مدرس معين
app.get('/api/teacher/:teacherId', (req, res) => {
  let foundTeacher = null;
  siteData.forEach(year => {
    year.subjects.forEach(sub => {
      const teacher = sub.teachers.find(t => t.id == req.params.teacherId);
      if (teacher) foundTeacher = teacher;
    });
  });
  res.json(foundTeacher || { error: "المدرس غير موجود" });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API يعمل على بورت ${PORT}`));

