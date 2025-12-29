/* ======================
   🔐 STRONG SITE PROTECTION
   ====================== */

// منع كل التفاعلات الضارة
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
});

// كشف DevTools + مراقبة السرعة
(function detectDevTools() {
  let lastTime = Date.now();
  const threshold = 160;

  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    const now = Date.now();

    // الكشف عن DevTools أو فتح نافذة جديدة بسرعة
    if (widthDiff > threshold || heightDiff > threshold || (now - lastTime < 50)) {
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

// تعطيل السحب العام
document.addEventListener("dragstart", e => e.preventDefault());

// منع تحديث الصفحة بالـ F5
window.addEventListener("keydown", e => {
  if (e.key === "F5") e.preventDefault();
});

