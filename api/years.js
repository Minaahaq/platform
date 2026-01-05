export default function handler(req, res) {
  const token = req.headers["x-client-token"];
  if (token !== process.env.CLIENT_SECRET) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  const dataPath = path.join(process.cwd(), 'data', 'organized_output.json');
  const siteData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const years = siteData.map(y => ({
    id: y.id,
    name: y.name,
    image_url: y.image_url,
    subjects_count: y.subjects?.length || 0
  }));

  res.status(200).json(years);
}
