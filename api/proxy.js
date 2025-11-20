import fetch from "node-fetch";

export default async function handler(req, res) {
  // ---------------------------------------
  // 1) Block Requests From Python / Bots
  // ---------------------------------------
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  const forbiddenAgents = [
    "python", "curl", "wget",
    "scrapy", "httpclient", "java",
    "okhttp", "libwww", "aiohttp",
    "node-fetch", "axios", "insomnia",
    "postman"
  ];

  if (forbiddenAgents.some(a => ua.includes(a))) {
    return res.status(403).json({ error: "Bot Access Denied" });
  }

  // ---------------------------------------
  // 2) Require Browser Fetch Headers
  // ---------------------------------------
  if (
    !req.headers["sec-fetch-site"] ||
    !req.headers["sec-fetch-mode"] ||
    !req.headers["accept"]
  ) {
    return res.status(403).json({ error: "Invalid Client" });
  }

  // ---------------------------------------
  // 3) Origin / Referer Protection
  // ---------------------------------------
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const site = process.env.SITE_URL;

  if (!origin.startsWith(site) && !referer.startsWith(site)) {
    return res.status(403).json({ error: "Origin Forbidden" });
  }

  // ---------------------------------------
  // 4) Internal request to protected API
  // ---------------------------------------
  try {
    const r = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-internal-key": process.env.INTERNAL_KEY
      }
    });

    if (!r.ok) {
      return res.status(500).json({ error: "Internal API Error" });
    }

    const json = await r.json();
    res.status(200).json(json.data || json);

  } catch (e) {
    res.status(500).json({ error: "Proxy Error", details: e.message });
  }
}
