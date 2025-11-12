// /api/oembed.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { url: qUrl, maxwidth, maxheight } = req.query || {};
    const host = `https://${req.headers.host}`;
    const asString = (qUrl || "").toString().trim();
    const slug = asString.replace(/^https?:\/\/[^/]+\/|\/+$/g, ""); // ambil slug aja
    const w = Math.min(parseInt(maxwidth || "400", 10) || 400, 1200);
    const h = Math.min(parseInt(maxheight || "180", 10) || 180, 800);
    const html = `<iframe src="${host}/api/render/${slug}" width="${w}" height="${h}" style="border:0;overflow:hidden;border-radius:12px" allow="autoplay; clipboard-write" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json({
      version: "1.0",
      type: "rich",
      provider_name: "Music Widget",
      provider_url: host,
      title: `Music Widget – ${slug}`,
      width: w,
      height: h,
      html,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "oEmbed generation failed" });
  }
}
