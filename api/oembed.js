// /api/oembed.js
export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
  
    try {
      const { url: qUrl, maxwidth, maxheight } = req.query || {};
      const host = `https://${req.headers.host}`;
  
      // 1) Normalisasi parameter ?url=
      let u;
      const asString = (qUrl || "").toString().trim();
  
      if (/^https?:\/\//i.test(asString)) {
        // full URL
        u = new URL(asString);
      } else if (asString.startsWith("/")) {
        // path
        u = new URL(host + asString);
      } else if (/^[a-z0-9][a-z0-9/_-]*$/i.test(asString)) {
        // slug saja (contoh: s92hiwrb)
        u = new URL(host + "/" + asString);
      } else {
        // fallback: coba Referer, lalu homepage
        const ref = req.headers.referer || req.headers.referrer || "";
        u = ref && /^https?:\/\//i.test(ref) ? new URL(ref) : new URL(host + "/");
      }
  
      // 2) Canonicalize ke host kamu
      const myHost = new URL(host).host;
      if (u.host !== myHost) {
        u.host = myHost;
        u.protocol = "https:";
      }
  
      const slug = u.pathname.replace(/^\/+/, ""); // bisa "" atau "abc123"
      const w = Math.min(parseInt(maxwidth || "400", 10) || 400, 1200);
      const h = Math.min(parseInt(maxheight || "180", 10) || 180, 800);
      const path = slug ? `/${slug}` : `/`;
  
      const html = `<iframe src="${host}${path}" width="${w}" height="${h}" style="border:0;overflow:hidden;border-radius:12px" allow="autoplay; clipboard-write" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
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
  