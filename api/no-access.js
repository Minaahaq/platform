export default function handler(req, res) {
  return res.status(403).json({
    success: false,
    statusCode: 403,
    error: "ACCESS_DENIED",
    message: "🚫 لا تملك صلاحية الوصول إلى هذا المورد",
    timestamp: new Date().toISOString()
  });
}
