// /api/prerender.js
export default async function handler(req, res) {
    const host = `https://${req.headers.host}`;
    const url = new URL(req.url, host);
    const target = url.searchParams.get("url") || `${host}/`;
    const oembedUrl = `${host}/api/oembed?url=${encodeURIComponent(target)}`;
  
    // Ambil index.html hasil build Vite (statis)
    // Penting: pastikan /index.html TIDAK direwrite ke API lagi (lihat vercel.json di bawah)
    const upstream = await fetch(`${host}/index.html`, {
      headers: { accept: "text/html" },
    });
  
    const html = await upstream.text();
  
    // Header yang Canva perlukan
    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader(
      "Link",
      `<${oembedUrl}>; rel="alternate"; type="application/json+oembed"`
    );
    // Boleh tetap izinkan Canva sebagai parent
    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors 'self' https://canva.com https://*.canva.com https://*.canva.site https://*.canva.dev https://*.canvausercontent.com;"
    );
  
    return res.send(html);
  }
  