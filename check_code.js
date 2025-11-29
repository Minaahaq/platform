// ==========================
// check_code.js
// نظام تحقق احترافي من صلاحية الكود
// ==========================

// رابط API
const API_URL = "https://script.google.com/macros/s/AKfycbxvLzKTlm_X51PGatqyiv1CPVm7W6uhKGeeCTKsSqOa3Dn9Rh9x5LU8t6zneTkCwRVz/exec";

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
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

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

  setTimeout(() => { toast.style.opacity = 1; toast.style.bottom = "50px"; }, 50);

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

  // لو مفيش بيانات → طرد فوراً
  if (!userData || !userCode) {
    window.location.href = redirectPage;
    return;
  }

  try {
    const device = getDeviceID();
    const url = `${API_URL}?action=check&code=${encodeURIComponent(userCode)}&device=${encodeURIComponent(device)}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const result = await res.json();

    // أي نتيجة غير success → طرد فوراً
    if (result.result !== "success") {
      localStorage.removeItem("user_code");
      localStorage.removeItem("user_data");
      showToast("⛔ الكود غير صالح أو غير موجود!", "error", 4000);

      setTimeout(() => {
        window.location.href = redirectPage;
      }, 1000); // طرد سريع
      return;
    }

    // الكود صالح → تمام
  } catch (err) {
    console.error("[CheckCode] خطأ أثناء التحقق:", err);
    showToast("⚠ خطأ في الاتصال بالخادم.", "error", 4000);

    setTimeout(() => {
      window.location.href = redirectPage;
    }, 1500); // طرد في حالة الخطأ
  }
}

/**
 * تشغيل التحقق تلقائياً عند فتح الصفحة
 */
window.addEventListener("DOMContentLoaded", () => {
  autoCheckCode();
});
