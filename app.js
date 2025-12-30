
/* ======================
   🔐 STRONG SITE PROTECTION
   (Disabled in App Creator)
   ====================== */

// 🔎 كشف هل داخل تطبيق App Creator / WebView
function isInMyApp() {
  return (
    /\bwv\b/i.test(navigator.userAgent) ||            // Android WebView
    /WebView/i.test(navigator.userAgent) ||           // iOS WebView
    /AppCreator|APKEditor|AndroidApp/i.test(navigator.userAgent)
  );
}

// ✅ لو داخل التطبيق → خروج فورًا (بدون أي حماية)
if (isInMyApp()) {
  console.log("✅ App Mode: Protection Disabled");
} else {

  // ======================
  // 🔒 الحماية للمتصفح فقط
  // ======================

  // منع التفاعلات الضارة
  ["contextmenu", "selectstart", "copy", "cut", "dragstart"].forEach(ev => {
    document.addEventListener(ev, e => e.preventDefault());
  });

  // منع اختصارات الكيبورد
  document.addEventListener("keydown", e => {
    const key = e.key.toUpperCase();
    const forbiddenKeys = ["U","S","C","A"];
    const forbiddenDevTools = ["I","J","C"];

    if (e.key === "F12") e.preventDefault();
    if (e.ctrlKey && e.shiftKey && forbiddenDevTools.includes(key)) e.preventDefault();
    if (e.ctrlKey && forbiddenKeys.includes(key)) e.preventDefault();
    if (e.key === "F5") e.preventDefault();
  });

  // كشف DevTools
  (function detectDevTools() {
    let lastTime = Date.now();
    const threshold = 160;

    setInterval(() => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const now = Date.now();

      if (
        widthDiff > threshold ||
        heightDiff > threshold ||
        (now - lastTime < 50)
      ) {
        document.body.innerHTML = `
          <div style="
            display:flex;
            justify-content:center;
            align-items:center;
            height:100vh;
            font-size:24px;
            background:#000;
            color:#f00;
            font-family:Arial;
            text-align:center;">
            🚫 Access Denied
          </div>`;
        document.body.style.pointerEvents = "none";
      }
      lastTime = now;
    }, 100);
  })();

  // تعطيل السحب
  document.addEventListener("dragstart", e => e.preventDefault());
}
