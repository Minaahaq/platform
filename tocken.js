// ===========================
// token.js — Safe Client Script
// ===========================

// عنوان البروكسي عندك
const API_URL = "/api/proxy";

// 🔄 دالة جلب البيانات (السيرفر فقط هو الذي يولد التوقيع)
async function fetchCourses() {
  try {
    const res = await fetch(API_URL, {
      method: "GET",
      headers: {
        "x-client": "web-app" // تعريف بسيط فقط
      }
    });

    const data = await res.json();
    console.log("Courses Response:", data);
    
    return data;
  } catch (err) {
    console.error("Proxy Error:", err);
    return null;
  }
}

// 📌 دالة عامة تقدر تناديها من أي صفحة
window.getCourses = fetchCourses;
