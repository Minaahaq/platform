export default async function handler(req, res) {
  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({ error: "Missing video URL" });
    }

    const response = await fetch(url);

    // السماح بالتشغيل في المتصفح
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Proxy streaming error" });
  }
}
