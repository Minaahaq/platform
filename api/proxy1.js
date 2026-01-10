import crypto from "crypto";

export default async function handler(req, res) {

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const fetchSite = req.headers["sec-fetch-site"];

if (fetchSite !== "same-origin") {
  return res.status(404).send("Not Found");
}
  // ===== session =====
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return res.status(401).json({ error: "NO_SESSION" });

  let session;
  try {
    session = JSON.parse(Buffer.from(match[1], "base64").toString("utf8"));
  } catch {
    return res.status(401).json({ error: "BAD_SESSION" });
  }

  const SECRET = process.env.SESSION_SECRET;
  if (!SECRET) return res.status(500).json({ error: "NO_SECRET" });

  // ===== verify =====
  const expectedSig = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(session.payload))
    .digest("hex");

  if (session.sig !== expectedSig) {
    return res.status(401).json({ error: "SESSION_INVALID" });
  }

  const ua = req.headers["user-agent"] || "";
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  if (session.payload.ua !== ua || session.payload.i !== ip) {
    return res.status(401).json({ error: "DEVICE_MISMATCH" });
  }

 // ===== 30 days expiry =====
if (Date.now() - session.payload.t > 30 * 24 * 60 * 60 * 1000) {
  return res.status(401).json({ error: "SESSION_EXPIRED" });
}


  if (/curl|postman|python|wget|httpclient/i.test(ua)) {
    return res.status(403).json({ error: "BLOCKED_CLIENT" });
  }

  // ===== rate limit =====
  const now = Date.now();
  handler.r = handler.r || new Map();
  const list = handler.r.get(ip) || [];
  const recent = list.filter(t => now - t < 30000);
  if (recent.length >= 20) {
    return res.status(429).json({ error: "TOO_MANY_REQUESTS" });
  }
  recent.push(now);
  handler.r.set(ip, recent);

  // ===== routing =====
  const { type, yearId, subjectId, teacherId, chapterId, lectureId } = req.query;
  const BASE = "https://platform-sigma-seven.vercel.app";

  let url = "";
  if (type === "years") url = `${BASE}/api/years`;
  else if (type === "subjects") url = `${BASE}/api/subjects?yearId=${yearId}`;
  else if (type === "teachers") url = `${BASE}/api/teachers?yearId=${yearId}&subjectId=${subjectId}`;
  else if (type === "chapters") url = `${BASE}/api/chapters?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}`;
  else if (type === "lectures") url = `${BASE}/api/lectures?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}`;
  else if (type === "videos") url = `${BASE}/api/videos?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}&lectureId=${lectureId}`;
  else return res.status(400).json({ error: "INVALID_TYPE" });

  const response = await fetch(url, {
  headers: {
    "User-Agent": "Secure-Proxy/1.0",
    "x-api-key": process.env.API_KEY,
    "x-internal-proxy": process.env.PROXY_SECRET
  }
});

  if (!response.ok) return res.status(502).json({ error: "UPSTREAM_ERROR" });
  const data = await response.json();

  // ===== renew session (auto) =====
  session.payload.t = Date.now();

  const newSig = crypto
    .createHmac("sha256", SECRET)
    .update(JSON.stringify(session.payload))
    .digest("hex");

  const newSession = Buffer
    .from(JSON.stringify({ payload: session.payload, sig: newSig }))
    .toString("base64");

  res.setHeader("Set-Cookie", [
    `session=${newSession}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`
  ]);

  return res.status(200).json(data);
      }
