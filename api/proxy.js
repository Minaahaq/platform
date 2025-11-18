export default async function handler(req, res) {
  try {
    const response = await fetch(`${process.env.SITE_URL}/api/courses`, {
      headers: {
        "x-api-key": process.env.SECRET_KEY
      }
    });

    const result = await response.json();

    // ✔ رجّعها دائمًا داخل data
    res.status(200).json({
      data: result.data || result
    });

  } catch (error) {
    res.status(500).json({
      error: "Proxy Error",
      details: error.message
    });
  }
}
