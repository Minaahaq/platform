import crypto from "crypto";

export default async function handler(req, res) {
  const ALLOWED_ORIGINS = ["https://test1-psi-nine-91.vercel.app"];

  // ===== التحقق من الميثود =====
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // ===== origin check =====
  let origin = req.headers.origin || null;
  if (!origin && req.headers.referer) {
    try { origin = new URL(req.headers.referer).origin; } catch {}
  }
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
  }

  // ===== token check =====
  const token = req.headers["x-client-token"];
  if (!token) return res.status(403).json({ error: "NO_TOKEN" });

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  } catch {
    return res.status(403).json({ error: "BAD_TOKEN" });
  }

  const secret = process.env.CLIENT_SECRET;
  if (!secret) return res.status(500).json({ error: "SERVER_SECRET_MISSING" });

  const ua = req.headers["user-agent"] || "";
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "0.0.0.0";

  const deviceHash = crypto.createHash("sha256").update(ua + "|" + ip).digest("hex");
  if (decoded.d !== deviceHash) return res.status(403).json({ error: "INVALID_DEVICE" });

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${decoded.o}|${decoded.t}|${decoded.d}|${decoded.sid}`)
    .digest("hex");

  if (decoded.s !== expectedSig) return res.status(403).json({ error: "SIGNATURE_INVALID" });
  if (decoded.o !== origin) return res.status(403).json({ error: "ORIGIN_MISMATCH" });
  if (Date.now() > decoded.t) return res.status(403).json({ error: "TOKEN_EXPIRED" });
  if (/curl|postman|python|node|wget|httpclient/i.test(ua)) return res.status(403).json({ error: "BLOCKED_CLIENT" });

  // ===== rate-limit =====
  const now = Date.now();
  if (!handler.requests) handler.requests = new Map();
  let list = handler.requests.get(ip) || [];
  list = list.filter(t => now - t < 30000);
  if (list.length >= 15) return res.status(429).json({ error: "TOO_MANY_REQUESTS" });
  list.push(now);
  handler.requests.set(ip, list);

  // ===== API routing =====
  const { type, yearId, subjectId, teacherId, chapterId, lectureId, examId, rid } = req.query;
  const BASE_URL = "https://platform-sigma-seven.vercel.app";

  try {
    let url = "";
    let isExternal = false;

    // ===== أنواع الـ API =====
    if (type === "years") url = `${BASE_URL}/api/years`;
    else if (type === "subjects") url = `${BASE_URL}/api/subjects?yearId=${yearId}`;
    else if (type === "teachers") url = `${BASE_URL}/api/teachers?yearId=${yearId}&subjectId=${subjectId}`;
    else if (type === "chapters") url = `${BASE_URL}/api/chapters?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}`;
    else if (type === "lectures") url = `${BASE_URL}/api/lectures?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}`;
    else if (type === "videos") url = `${BASE_URL}/api/videos?yearId=${yearId}&subjectId=${subjectId}&teacherId=${teacherId}&chapterId=${chapterId}&lectureId=${lectureId}`;
    else if (type === "exams") {
      if (!lectureId) return res.status(400).json({ error: "LECTURE_ID_REQUIRED" });
      url = `https://zeta-gray.vercel.app/api/proxy/lecture-content/${lectureId}`;
      isExternal = true;
    }
    else if (type === "exam_questions") {
      if (!examId) return res.status(400).json({ error: "EXAM_ID_REQUIRED" });
      url = `https://zeta-gray.vercel.app/user/exams/${examId}/questions`;
      isExternal = true;
    }
    else if (type === "exam_submit") {
      if (!examId) return res.status(400).json({ error: "EXAM_ID_REQUIRED" });
      if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
      const body = req.body;
      if (!body?.answers) return res.status(400).json({ error: "ANSWERS_REQUIRED" });

      const submitUrl = `https://zeta-gray.vercel.app/user/exams/${examId}/submit`;
      const submitResponse = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Secure-Proxy/1.0"
        },
        body: JSON.stringify(body)
      });
      if (!submitResponse.ok) return res.status(502).json({ error: "UPSTREAM_ERROR" });
      const submitData = await submitResponse.json();
      return res.status(200).json(submitData);
    }
    else if (type === "exam_result") {
      if (!rid) return res.status(400).json({ error: "RESULT_ID_REQUIRED" });
      url = `https://zeta-gray.vercel.app/user/exams/result/${rid}`;
      isExternal = true;
    }
    else return res.status(400).json({ error: "INVALID_TYPE" });

    // ===== fetch data =====
    const headers = { "User-Agent": "Secure-Proxy/1.0" };
    if (!isExternal) {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return res.status(500).json({ error: "NO_API_KEY" });
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) return res.status(502).json({ error: "UPSTREAM_ERROR" });

    const data = await response.json();

    // ===== إعادة البيانات =====
    if (type === "exam_questions" || type === "exam_result") return res.status(200).json(data);
    return res.status(200).json(isExternal ? { exams: data?.content?.exams || [] } : data);

  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
