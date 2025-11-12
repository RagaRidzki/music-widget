export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { url: qUrl, maxwidth, maxheight } = req.query || {};
        const host = `https://${req.headers.host}`;

        // Pakai ?url= kalau ada; kalau tidak ada, fallback ke homepage
        const u = qUrl ? new URL(qUrl) : new URL(host + "/");

        // Canonicalize biar selalu ke domain kamu
        const allowed = new Set([new URL(host).host, "music-widget-delta.vercel.app"]);
        if (!allowed.has(u.host)) {
            u.host = new URL(host).host;
            u.protocol = "https:";
        }

        const slug = u.pathname.replace(/^\/+/, "");
        const w = Math.min(parseInt(maxwidth || "400", 10) || 400, 1200);
        const h = Math.min(parseInt(maxheight || "180", 10) || 180, 800);

        // Langsung gunakan /:slug (atau / kalau kosong)
        const path = slug ? `/${slug}` : "/";
        const html = `<iframe src="${host}${path}" width="${w}" height="${h}" style="border:0;overflow:hidden;border-radius:12px" allow="autoplay; clipboard-write" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).json({
            version: "1.0",
            type: "rich",
            provider_name: "Music Widget",
            provider_url: host,
            title: `Music Widget${slug ? " – " + slug : ""}`,
            width: w,
            height: h,
            html
        });
    } catch (e) {
        console.error(e);
        const host = `https://${req.headers.host}`;
        // Tetap 200 supaya Canva treat as embeddable
        return res.status(200).json({
            version: "1.0",
            type: "rich",
            provider_name: "Music Widget",
            provider_url: host,
            title: "Music Widget",
            width: 400,
            height: 180,
            html: `<iframe src="${host}/" width="400" height="180" style="border:0;overflow:hidden;border-radius:12px" allow="autoplay; clipboard-write" loading="lazy"></iframe>`
        });
    }
}
