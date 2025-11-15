export default function handler(req, res) {
  const allowedDomain = "https://pluso-one.vercel.app";

  const referer = req.headers.referer || "";
  
  // لو الريكوست مش جاي من موقعك → اقفل
  if (!referer.startsWith(allowedDomain)) {
    return res.status(403).json({ error: "Access Forbidden" });
  }

  // CORS
  res.setHeader("Access-Control-Allow-Origin", allowedDomain);
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const data = require("../data/coursatk_scraped_data.json");
  res.status(200).json(data);
}
