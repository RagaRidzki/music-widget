// /api/widgets.js
import { supabaseAdmin } from "./_supabaseAdmin.js";

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, If-None-Match");
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      // body: { slug, title, tracks: [{orderIndex, publicUrl, title?, artist?, duration_sec?}] }
      const { slug, title, tracks } = req.body || {};
      if (!slug || !Array.isArray(tracks) || tracks.length === 0) {
        return res.status(400).json({ error: "slug & tracks required" });
      }

      // 1) upsert widget
      const { data: wData, error: wErr } = await supabaseAdmin
        .from("widgets")
        .upsert({ slug, title: title ?? null }, { onConflict: "slug" })
        .select()
        .single();
      if (wErr) return res.status(500).json({ error: wErr.message });

      const widgetId = wData.id;

      // 2) sanitize tracks
      const cleaned = tracks
        .map((t, i) => ({
          widget_id: widgetId,
          title: t.title ? String(t.title) : null,
          artist: t.artist ? String(t.artist) : null,
          url: String(t.publicUrl || t.url || ""),
          duration_sec: Number.isFinite(t.duration_sec) ? Math.max(0, Math.floor(t.duration_sec)) : null,
          order_index: Number.isFinite(t.orderIndex) ? t.orderIndex : i,
        }))
        .filter(t => t.url)
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, 3);

      if (cleaned.length === 0) {
        return res.status(400).json({ error: "tracks invalid/empty" });
      }

      // 3) replace tracks (idempotent)
      const { error: delErr } = await supabaseAdmin
        .from("tracks")
        .delete()
        .eq("widget_id", widgetId);
      if (delErr) return res.status(500).json({ error: delErr.message });

      const { data: tData, error: tErr } = await supabaseAdmin
        .from("tracks")
        .insert(cleaned)
        .select()
        .order("order_index", { ascending: true });
      if (tErr) return res.status(500).json({ error: tErr.message });

      return res.status(200).json({
        widget: {
          id: widgetId,
          slug: wData.slug,
          title: wData.title,
          tracks: tData,
        },
      });
    }

    if (req.method === "GET") {
      const slug = (req.query.slug || "").toString().trim();
      if (!slug) return res.status(400).json({ error: "slug is required" });

      // 1 query + order embedded relation
      const { data, error } = await supabaseAdmin
        .from("widgets")
        .select(`
          id,
          slug,
          title,
          updated_at,
          tracks (
            id,
            title,
            artist,
            url,
            duration_sec,
            order_index
          )
        `)
        .eq("slug", slug)
        .order("order_index", { ascending: true, foreignTable: "tracks" })
        .single();

      if (error) {
        const code = error.code === "PGRST116" ? 404 : 500;
        return res.status(code).json({ error: error.message });
      }

      // cache + ETag
      const etag = `"${data.updated_at ?? data.id}"`;
      res.setHeader("ETag", etag);
      if (req.headers["if-none-match"] === etag) {
        res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
        return res.status(304).end();
      }

      res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");

      return res.status(200).json({
        widget: {
          id: data.id,
          slug: data.slug,
          title: data.title,
          tracks: data.tracks || [],
          updated_at: data.updated_at,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
