// /api/render/[slug].js
import { supabaseAdmin } from "../_supabaseAdmin.js";

export default async function handler(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).send("slug required");

  const { data, error } = await supabaseAdmin
    .from("widgets")
    .select(`
      id, slug, title,
      tracks ( title, artist, url, duration_sec, order_index )
    `)
    .eq("slug", slug)
    .order("order_index", { ascending: true, foreignTable: "tracks" })
    .single();

  if (error || !data)
    return res.status(404).send("Widget not found");

  const cfg = {
    slug: data.slug,
    title: data.title,
    tracks: data.tracks || [],
  };

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Music Widget – ${cfg.slug}</title>
<style>
body{margin:0;font:14px ui-sans-serif,system-ui;background:#fff;color:#000;}
.pill{position:fixed;bottom:16px;right:16px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;
box-shadow:0 6px 20px rgba(0,0,0,.1);padding:10px 12px;display:grid;grid-template-columns:48px 1fr;gap:10px;}
.btn{width:48px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:none;border:0;}
.list{position:fixed;bottom:86px;right:16px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;
box-shadow:0 12px 32px rgba(0,0,0,.15);max-height:260px;overflow:auto;width:260px;}
.row{display:flex;gap:12px;align-items:center;padding:10px 14px;cursor:pointer;border:0;background:transparent;width:100%;text-align:left;}
.row:hover{background:#f9fafb;}
.badge{width:36px;height:36px;border-radius:8px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;}
</style>
</head>
<body>
<div id="app"></div>
<script>
  const cfg = ${JSON.stringify(cfg)};
  let idx=0,playing=false,show=false;
  const audio = new Audio();
  audio.preload="metadata";audio.muted=true;audio.playsInline=true;
  function type(u){u=u.toLowerCase();if(u.endsWith(".mp3"))return"audio/mpeg";
  if(u.endsWith(".ogg"))return"audio/ogg";if(u.endsWith(".m4a")||u.endsWith(".mp4"))return"audio/mp4";}
  function setSrc(i){idx=i;const t=cfg.tracks[idx]||{};audio.pause();audio.currentTime=0;
    audio.src=t.url||t.publicUrl||"";try{audio.load();}catch(e){}audio.play().then(()=>{playing=true;paint();}).catch(()=>{playing=false;paint();});}
  function toggle(){if(audio.paused){audio.play().then(()=>{playing=true;paint();});}else{audio.pause();playing=false;paint();}}
  function toggleList(){show=!show;paint();}
  window.addEventListener("pointerdown",function once(){audio.muted=false;audio.volume=0;(function step(){audio.volume=Math.min(1,audio.volume+0.15);
  if(audio.volume<1)requestAnimationFrame(step);})();window.removeEventListener("pointerdown",once);},{once:true});
  function h(html){const d=document.createElement("div");d.innerHTML=html;return d.firstChild;}
  function paint(){
    const root=document.getElementById("app");root.innerHTML="";
    if(cfg.tracks.length===0){root.appendChild(h('<div class="pill">No tracks</div>'));return;}
    if(show){const list=h('<div class="list"></div>');
      cfg.tracks.forEach((t,i)=>{const row=h('<button class="row"></button>');
        row.onclick=()=>setSrc(i);
        row.innerHTML='<div class="badge">'+(i===idx&&playing?'⏸':'▶')+'</div>'+
        '<div style="flex:1;min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+
        (t.title||('Track '+(i+1)))+'</div><div style="color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+
        (t.artist||'')+'</div></div>';
        list.appendChild(row);});
      root.appendChild(list);}
    const pill=h('<div class="pill"></div>');
    const btnL=h('<button class="btn" title="Play/Pause">'+(playing?'⏸':'▶')+'</button>');
    btnL.onclick=toggle;
    const right=h('<div style="display:flex;justify-content:flex-end;gap:8px;align-items:center"></div>');
    const btnList=h('<button class="btn" title="Playlist">≡</button>');btnList.onclick=toggleList;
    const btnClose=h('<button class="btn" title="Close">✕</button>');btnClose.onclick=()=>{root.innerHTML="";};
    right.appendChild(btnList);right.appendChild(btnClose);
    pill.appendChild(btnL);pill.appendChild(right);
    root.appendChild(pill);
  }
  if(cfg.tracks.length>0)setSrc(0);else paint();
</script>
</body>
</html>`);
}
