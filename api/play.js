import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const usedNonces = new Set();

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).end();

  const ua = req.headers["user-agent"] || "";
  const ip = crypto
    .createHash("sha256")
    .update(req.headers["x-forwarded-for"] || req.socket.remoteAddress)
    .digest("hex");

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(token, "base64").toString());
  } catch {
    return res.status(401).end();
  }

  const { payload, sig } = decoded;

  const expected = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  if (sig !== expected) return res.status(401).end();
  if (Date.now() > payload.exp) return res.status(401).end();
  if (payload.ua !== ua) return res.status(401).end();
  if (payload.ip !== ip) return res.status(401).end();

  // ⛔ منع إعادة استخدام التوكن
  if (usedNonces.has(payload.nonce)) return res.status(403).end();
  usedNonces.add(payload.nonce);
  setTimeout(() => usedNonces.delete(payload.nonce), 15_000);

  // ===== session =====
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return res.status(401).end();

  const session = JSON.parse(Buffer.from(match[1], "base64").toString());
  if (session.payload.sid !== payload.sid) return res.status(401).end();

  // ===== get video =====
  const data = JSON.parse(
    await fs.readFile(
      path.join(process.cwd(), "data", "organized_output.json"),
      "utf8"
    )
  );

  let video;
  data.forEach(y =>
    y.subjects.forEach(s =>
      s.teachers.forEach(t =>
        t.chapters.forEach(c =>
          c.lectures.forEach(l => {
            const v = l.videos.find(v => v.id === payload.vid);
            if (v) video = v;
          })
        )
      )
    )
  );

  if (!video) return res.status(404).end();

  res.json({
    stream_url: video.stream_url
  });
}
