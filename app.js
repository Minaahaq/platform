(function() {
  const ua = navigator.userAgent || "";
  const inAppCreator =
    ua.includes("AppCreator24") ||
    ua.includes("wv") ||
    ua.includes("WebView");

  if (!inAppCreator) {
    // لو مش داخل التطبيق، حوله لصفحة البلوك مباشرة
    window.location.href = "/blocked.html"; // ضع هنا رابط صفحة البلوك
  }
})();
