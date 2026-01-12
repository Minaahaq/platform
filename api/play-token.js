import crypto from "crypto";

const usedNonces = new Set();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { videoId } = req.body;
  if (!videoId) return res.status(400).end();

  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return res.status(401).end();

  const session = JSON.parse(Buffer.from(match[1], "base64").toString());
  const ua = req.headers["user-agent"] || "";
  const ip = crypto
    .createHash("sha256")
    .update(req.headers["x-forwarded-for"] || req.socket.remoteAddress)
    .digest("hex");

  const payload = {
    vid: videoId,
    sid: session.payload.sid,
    ua,
    ip,
    exp: Date.now() + 10_000,
    nonce: crypto.randomUUID()
  };

  const sig = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  res.json({
    token: Buffer.from(JSON.stringify({ payload, sig })).toString("base64")
  });
}
