import crypto from "crypto";

export default async function handler(req, res) {

  const ua = (req.headers["user-agent"] || "").toLowerCase();

  // السماح فقط لو الطلب جاي من WebView داخل التطبيق
  if (
    !ua.includes("apkrito") &&
    !ua.includes("wv") &&
    !ua.includes("webview")
  ) {
    return res.status(403).json({ error: "App Only Access" });
  }

  // التحقق من البصمة
  const signature = req.headers["x-signature"];

  if (!signature) {
    return res.status(403).json({ error: "No signature" });
  }

  // هل البصمة Base64؟ (لو مش → تزوير)
  try {
    atob(signature);
  } catch {
    return res.status(403).json({ error: "Invalid signature" });
  }

  try {
    // جلب البيانات المشفرة من API الأصلي (Courses)
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    const encrypted = await response.json();

    const key = Buffer.from(process.env.DATA_KEY, "hex");
    const iv = Buffer.from(encrypted.iv, "hex");
    const encryptedData = Buffer.from(encrypted.data, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedData, null, "utf8");
    decrypted += decipher.final("utf8");

    const jsonData = JSON.parse(decrypted);

    res.status(200).json(jsonData);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
