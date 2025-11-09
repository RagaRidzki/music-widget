export default async function handler(req, res) {
    try {
        const fullUrl = (req.query.url || "").toString();
        const m = fullUrl.match(/\/([a-z0-9]{6,12})(?:[/?#]|$)/i);
        const slug = m ? m[1] : null;

        if (!slug) {
            return res.status(400).json({ error: "Bad url" });
        }

        const pageUrl = `https://music-widget-delta.vercel.app/${slug}`;
        const iframeSrc = pageUrl; 
        const width = 400;
        const height = 180;

        const html = `
        <iframe
            src="${iframeSrc}"
            width="${width}"
            height="${height}"
            style="border:0;overflow:hidden;border-radius:12px"
            allow="autoplay; clipboard-write"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
        </iframe>`.trim();

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Access-Control-Allow-Origin", "*");

        return res.status(200).json({
            version: "1.0",
            type: "rich",
            provider_name: "Music Widget",
            provider_url: "https://music-widget-delta.vercel.app",
            title: `Music Widget – ${slug}`,
            width,
            height,
            html,
            thumbnail_width: width,
            thumbnail_height: height,
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "oEmbed error" });
    }
}
