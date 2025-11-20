import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const r = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-internal-key": process.env.INTERNAL_KEY
      }
    });

    if (!r.ok) {
      return res.status(500).json({ error: "Internal API Error" });
    }

    const result = await r.json();
    res.status(200).json(result.data || result);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
