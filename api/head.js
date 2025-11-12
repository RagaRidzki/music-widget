// /api/head.js
export default async function handler(req, res) {
    const host = `https://${req.headers.host}`;
    const url = new URL(req.url, host);
    const target = url.searchParams.get("url") || `${host}/`;
    const oembedUrl = `${host}/api/oembed?url=${encodeURIComponent(target)}`;
  
    // Tambahkan header Link buat Canva
    res.setHeader(
      "Link",
      `<${oembedUrl}>; rel=\"alternate\"; type=\"application/json+oembed\"`
    );
  
    // CSP biar tetap aman di-iframe oleh Canva
    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors 'self' https://canva.com https://*.canva.com https://*.canva.site https://*.canva.dev https://*.canvausercontent.com;"
    );
  
    // Redirect langsung ke halaman aslinya
    res.writeHead(302, { Location: target });
    res.end();
  }
  