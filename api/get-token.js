export default function handler(req, res) {
  const secret = process.env.CLIENT_SECRET; // نفس السر في البروكسي

  const expires = Date.now() + 5 * 60 * 1000; // صالح 5 دقائق
  const token = Buffer.from(`${secret}:${expires}`).toString("base64");

  res.status(200).json({ token, expires });
}
