import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";
const GOOGLE_SCRIPT_API =
  "https://script.google.com/macros/s/AKfycbxvLzKTlm_X51PGatqyiv1CPVm7W6uhKGeeCTKsSqOa3Dn9Rh9x5LU8t6zneTkCwRVz/exec";

export default async function handler(req, res) {

  try {
    const { code, device } = req.query;

    if (!code || !device)
      return res.status(400).json({ error: "code و device مطلوب" });

    // الاتصال بـ Google Script
    const response = await fetch(
      `${GOOGLE_SCRIPT_API}?action=check&code=${encodeURIComponent(code)}&device=${encodeURIComponent(device)}`
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log("GS RAW RESPONSE =>", text);
      return res.status(502).json({ error: "google_script_invalid_response" });
    }

    if (data.result !== "success")
      return res.status(401).json({ error: "الكود غير صحيح" });

    // إنشاء JWT صالح 24 ساعة
    const token = jwt.sign({ code, device }, SECRET, { expiresIn: "24h" });

    return res.status(200).json({
      result: "success",
      token,
      user: data
    });

  } catch (err) {
    console.log("LOGIN ERROR =>", err);
    return res.status(500).json({
      error: "server_failed",
      message: err?.message || "unknown"
    });
  }
}
