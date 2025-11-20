export default async function handler(req, res) {
  const site = process.env.SITE_URL;
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  // حماية: لو الطلب مش من موقعك → اقفل
  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Access Forbidden" });
  }

  try {
    const response = await fetch(${process.env.SITE_URL}/api/courses, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    const result = await response.json();

    // هذا هو السطر المهم
    const data = result.data || result;

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
