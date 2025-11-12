// middleware.js
import { NextResponse } from 'next/server';

export const config = {
  matcher: '/((?!api|assets|favicon.ico).*)',
};

export function middleware(req) {
  const url = new URL(req.url);
  const oembedUrl = `${url.origin}/api/oembed?url=${encodeURIComponent(url.href)}`;

  const res = NextResponse.next();
  res.headers.set(
    'Link',
    `<${oembedUrl}>; rel="alternate"; type="application/json+oembed"`
  );

  // jaga CSP biar Canva tetep bisa embed
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://canva.com https://*.canva.com https://*.canva.site https://*.canva.dev https://*.canvausercontent.com;"
  );

  return res;
}
