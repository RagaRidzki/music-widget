// /api/oembed.js
export default async function handler(req, res) {
    // CORS & CSP (biar konsisten dengan vercel.json juga gapapa)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { url: qUrl, maxwidth, maxheight } = req.query || {};
        // Fallback: kalau konsumen nggak kirim ?url=, pakai Referer
        const referer = req.headers.referer || req.headers.referrer || "";
        const pageUrl = (qUrl || referer || "").toString();

        // Validasi minimal
        const host = `https://${req.headers.host}`;
        const isValid =
            pageUrl.startsWith(host + "/") ||
            pageUrl.startsWith("https://music-widget-delta.vercel.app/");
        if (!pageUrl || !isValid) {
            return res.status(400).json({ error: "Missing/invalid url param" });
        }

        const u = new URL(pageUrl);
        const slug = u.pathname.replace(/^\/+/, "");
        const w = Math.min(parseInt(maxwidth || "400", 10) || 400, 1200);
        const h = Math.min(parseInt(maxheight || "180", 10) || 180, 800);

        const iframe = `<iframe src="${host}/${slug}" width="${w}" height="${h}" style="border:0;overflow:hidden;border-radius:12px" allow="autoplay; clipboard-write" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

        res.setHeader(
            "Content-Security-Policy",
            "frame-ancestors 'self' https://canva.com https://*.canva.com https://*.canva.site https://*.canva.dev https://*.canvausercontent.com;"
        );
        res.setHeader("Content-Type", "application/json; charset=utf-8");

        return res.status(200).json({
            version: "1.0",
            type: "rich",
            provider_name: "Music Widget",
            provider_url: host,
            title: `Music Widget – ${slug}`,
            width: w,
            height: h,
            html: iframe
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "oEmbed error" });
    }
}
