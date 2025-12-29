/* ======================
   🔐 SITE PROTECTION
   ====================== */

// منع كليك يمين
document.addEventListener("contextmenu", e => {
  e.preventDefault();
  return false;
});

// منع التحديد والنسخ
document.addEventListener("selectstart", e => e.preventDefault());
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("cut", e => e.preventDefault());

// منع اختصارات الكيبورد
document.addEventListener("keydown", function (e) {
  // F12
  if (e.keyCode === 123) {
    e.preventDefault();
    return false;
  }

  // Ctrl + Shift + I / J / C
  if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) {
    e.preventDefault();
    return false;
  }

  // Ctrl + U / S / C / A
  if (e.ctrlKey && ["U", "S", "C", "A"].includes(e.key)) {
    e.preventDefault();
    return false;
  }
});

// كشف DevTools
(function detectDevTools() {
  const threshold = 160;
  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > threshold || heightDiff > threshold) {
      document.body.innerHTML = `
        <div style="
          display:flex;
          justify-content:center;
          align-items:center;
          height:100vh;
          font-size:24px;
          background:#000;
          color:#f00;
          font-family:Arial">
          🚫 Access Denied
        </div>`;
    }
  }, 500);
})();

// تعطيل السحب
document.ondragstart = () => false;
