export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { url: qUrl, maxwidth, maxheight } = req.query || {};
        const host = `https://${req.headers.host}`;
        const pageUrl = String(qUrl || "");
        const u = pageUrl ? new URL(pageUrl) : new URL(host + "/");

        const allowedHosts = new Set([new URL(host).host, "music-widget-delta.vercel.app"]);
        if (!allowedHosts.has(u.host)) {
            u.host = new URL(host).host;
            u.protocol = "https:";
        }

        const slug = u.pathname.replace(/^\/+/, "");
        const w = Math.min(parseInt(maxwidth || "400", 10) || 400, 1200);
        const h = Math.min(parseInt(maxheight || "180", 10) || 180, 800);

        // 🔧 fallback diarahkan ke /create (bukan /embed/)
        const iframeSlug = slug ? `/embed/${slug}` : `/create`;
        const iframe = `<iframe src="${host}${iframeSlug}" width="${w}" height="${h}" style="border:0;overflow:hidden;border-radius:12px" allow="autoplay; clipboard-write" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

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
            title: `Music Widget${slug ? ' – ' + slug : ''}`,
            width: w,
            height: h,
            html: iframe,
        });
    } catch (e) {
        console.error(e);
        return res.status(200).json({
            version: "1.0",
            type: "rich",
            provider_name: "Music Widget",
            provider_url: `https://${req.headers.host}`,
            title: "Music Widget",
            width: 400,
            height: 180,
            html: `<iframe src="https://${req.headers.host}/create" width="400" height="180" style="border:0;overflow:hidden;border-radius:12px" allow="autoplay; clipboard-write" loading="lazy"></iframe>`
        });
    }
}
