export default function handler(req, res) {
  res.setHeader("X-System", "SECURITY-GATE");
  res.setHeader("Cache-Control", "no-store");

  return res.status(403).json({
    success: false,
    system: true,
    code: "FORBIDDEN_REQUEST",
    message: "تم حظر الطلب بواسطة نظام الحماية",
    action: "Request logged",
    timestamp: Date.now()
  });
}
