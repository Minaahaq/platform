import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { type, yearId, subjectId, teacherId } = req.query;
 const BASE_URL = "https://platform-sigma-seven.vercel.app";
 // رابط مشروعك بعد النشر

let url = "";
if(type === "years") url = `${BASE_URL}/api/years`;
else if(type === "subjects") url = `${BASE_URL}/api/subjects?yearId=${yearId}`;
else if(type === "teachers") url = `${BASE_URL}/api/teachers?yearId=${yearId}&subjectId=${subjectId}`;
else if(type === "chapters") url = `${BASE_URL}/api/chapters?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}`;
else if(type === "lectures") url = `${BASE_URL}/api/lectures?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}`;
else if(type === "videos") url = `${BASE_URL}/api/videos?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}&lectureId=${lectureId}`;

  try {
    const response = await fetch(url, {
      headers: { "x-api-key": process.env.API_KEY } // 🔐 المفتاح السري
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data", details: err.message });
  }
}



