// ==========================
// check_code.js
// نظام تحقق احترافي من صلاحية الكود
// ==========================

// رابط API
const API_URL = "https://script.google.com/macros/s/AKfycbzIUhokuivKzt88Uzjg1zW0QHRUY_ZVSH6co-gojamtTk-IJxHxBA3GzEz8kauiSVKzZg/exec";

/**
 * إنشاء أو الحصول على معرف الجهاز
 */
function getDeviceID() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "dev-" + crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

/**
 * عرض نافذة إشعار احترافية
 */
function showToast(message, type = "error", duration = 4000) {
  // إنشاء العنصر
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  // إضافة ستايل
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "30px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "15px 25px",
    background: type === "success" ? "#4ade80" : "#f87171",
    color: "#fff",
    fontSize: "16px",
    borderRadius: "10px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
    zIndex: 9999,
    opacity: 0,
    transition: "opacity 0.5s ease, bottom 0.5s ease"
  });

  // إظهار النافذة
  setTimeout(() => { toast.style.opacity = 1; toast.style.bottom = "50px"; }, 50);
  // إخفاء وإزالة العنصر
  setTimeout(() => {
    toast.style.opacity = 0;
    toast.style.bottom = "30px";
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

/**
 * تحقق تلقائي من صلاحية الكود
 */
async function autoCheckCode(redirectPage = "index.html") {
  const userData = localStorage.getItem("user_data");
  const userCode = localStorage.getItem("user_code");

  if (!userData || !userCode) return; // لا توجد بيانات → تجاهل

  try {
    const device = getDeviceID();
    const url = `${API_URL}?action=check&code=${encodeURIComponent(userCode)}&device=${encodeURIComponent(device)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const result = await res.json();

    if (result.result !== "success") {
      // الكود انتهى
      localStorage.removeItem("user_code");
      localStorage.removeItem("user_data");
      showToast("⛔ انتهت صلاحية الكود أو غير صالح، سيتم إعادة التوجيه...", "error", 5000);

      setTimeout(() => {
        window.location.href = redirectPage;
      }, 2000); // إعادة التوجيه بعد ثانيتين
    }
    // الكود صالح → يمكن الاستمرار
  } catch (err) {
    console.error("[CheckCode] خطأ أثناء التحقق:", err);
    showToast("⚠ خطأ في الاتصال بالخادم، حاول لاحقاً.", "error", 5000);
  }
}

/**
 * تشغيل التحقق تلقائياً عند فتح الصفحة
 */
window.addEventListener("DOMContentLoaded", () => {
  autoCheckCode();
});
