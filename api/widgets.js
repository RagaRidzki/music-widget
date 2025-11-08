import { supabaseAdmin } from "./_supabaseAdmin.js";

function withCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "POST") {
      const { slug, title, tracks } = req.body || {};
      if (!slug || !Array.isArray(tracks) || tracks.length === 0) {
        return res.status(400).json({ error: "slug & tracks required" });
      }

      const cleaned = tracks
        .map(t => ({
          orderIndex: Number(t.orderIndex ?? 0),
          publicUrl: String(t.publicUrl ?? ""),
          fileType: String(t.fileType ?? "audio/mpeg"),
          title: t.title ? String(t.title) : null,
        }))
        .filter(t => t.publicUrl)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .slice(0, 3);

      const { data, error } = await supabaseAdmin
        .from("widgets")
        .upsert({ slug, title: title ?? null, tracks: cleaned }, { onConflict: "slug" })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ widget: data });
    }

    if (req.method === "GET") {
      const slug = (req.query.slug || "").toString().trim();
      if (!slug) return res.status(400).json({ error: "slug is required" });

      const { data, error } = await supabaseAdmin
        .from("widgets")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        const code = error.code === "PGRST116" ? 404 : 500;
        return res.status(code).json({ error: error.message });
      }
      return res.status(200).json({ widget: data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
