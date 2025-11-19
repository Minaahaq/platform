(function() {
  const ua = navigator.userAgent || "";
  const inAppCreator =
    ua.includes("AppCreator24") ||
    ua.includes("wv") ||
    ua.includes("WebView");

  if (!inAppCreator) {
    document.body.innerHTML = `
      <div style="
        display:flex;
        justify-content:center;
        align-items:center;
        height:100vh;
        flex-direction:column;
        background:#000;
        color:#ffd700;
        font-family:'Cairo',sans-serif;
        text-align:center;
        padding:20px;">
        <h2>⚠️ هذا الإصدار يعمل داخل تطبيق الثانويه بلس فقط</h2>
        <p>قم بتحميل التطبيق من الرابط التالي 👇</p>
        <a href="https://www.appcreator24.com/app3711758-ykz86f"
           style="background:#ffd700;color:#000;padding:12px 20px;border-radius:10px;
                  text-decoration:none;font-weight:bold;margin-top:15px;">
          📲 تحميل التطبيق
        </a>
      </div>`;
  }
})();
