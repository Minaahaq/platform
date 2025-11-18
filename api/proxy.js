export default async function handler(req, res) {
  try {
    const response = await fetch("https://platform-sigma-seven.vercel.app/api/courses", {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: "Proxy Error", details: error.message });
  }
}
