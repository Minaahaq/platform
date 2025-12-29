/* ======== 🔐 ULTIMATE FRONTEND PROTECTION ======== */

(function () {

  // تعطيل كل محاولات النسخ والتحديد والسحب
  ["contextmenu","selectstart","copy","cut","dragstart"].forEach(e =>
    document.addEventListener(e, ev => ev.preventDefault())
  );

  // منع كل الاختصارات الشائعة لفتح السورس
  document.addEventListener("keydown", e => {
    const k = e.key.toUpperCase();
    if (e.key === "F12") e.preventDefault();
    if (e.ctrlKey && ["U","S","A","C"].includes(k)) e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(k)) e.preventDefault();
    if (e.key === "F5") e.preventDefault();
  });

  // تعطيل Inspect عبر console.log trap
  const devtools = /./;
  devtools.toString = function () {
    lockPage();
  };
  console.log("%c", devtools);

  // كشف تغيير حجم النافذة لفتح DevTools
  let threshold = 160;
  setInterval(() => {
    if (
      Math.abs(window.outerHeight - window.innerHeight) > threshold ||
      Math.abs(window.outerWidth - window.innerWidth) > threshold
    ) {
      lockPage();
    }
  }, 120);

  // كشف إبطاء تنفيذ السكربت (علامة debugging)
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    if (now - last > 300) lockPage();
    last = now;
  }, 200);

  // تعطيل التفاعل بالكامل عند الاشتباه
  function lockPage() {
    document.body.innerHTML = `
      <div style="
        display:flex;justify-content:center;align-items:center;
        height:100vh;background:#000;color:#f00;font-size:26px;
        font-family:Arial;text-align:center">
        🚫 Access Denied<br>Developer Tools Detected
      </div>`;
    document.body.style.pointerEvents = "none";
  }

})();

