// /api/oembed.js
export default function handler(req, res) {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }
  
    const url = (req.query.url || '').toString();
    const u = new URL(url || '', `https://${req.headers.host}`);
    // validasi basic
    if (!u.hostname.endsWith('vercel.app')) {
      return res.status(400).json({ error: 'invalid url' });
    }
  
    const slugPath = u.pathname; // ex: /k76utd95
    const src = `${u.origin}${slugPath}`;
  
    const payload = {
      version: '1.0',
      type: 'rich',
      provider_name: 'Music Widget',
      provider_url: `${u.origin}`,
      title: `Music Widget – ${slugPath.replace('/', '')}`,
      width: 400,
      height: 180,
      html: `<iframe src="${src}" width="400" height="180"
              style="border:0;overflow:hidden;border-radius:12px"
              allow="autoplay; clipboard-write"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"></iframe>`
    };
  
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(payload));
  }
  