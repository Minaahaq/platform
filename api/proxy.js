export default async function handler(req, res) {

  const origin = req.headers.origin || "";
  const allowedOrigin = process.env.SITE_URL;

  // لو الطلب مش جاي من موقعك اقفله
  if (origin !== allowedOrigin) {
    return res.status(403).json({ error: "Access Forbidden" });
  }

  try {
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
