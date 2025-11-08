// src/pages/Widget.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export default function Widget() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [widget, setWidget] = useState(null);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(true);
  const [showList, setShowList] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [everInteracted, setEverInteracted] = useState(false);
  const audioRef = useRef(null);

  // fetch metadata
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await fetch(`/api/widgets?slug=${encodeURIComponent(slug)}`).then(async r=>{
          const t = await r.text(); try { return JSON.parse(t); } catch { return { error:`Non-JSON (${r.status})`, raw:t }; }
        });
        if (!active) return;
        if (resp.error) throw new Error(resp.error);
        setWidget(resp.widget);
        setIdx(0);
      } catch(e){
        console.error(e);
        setWidget(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return ()=>{ active=false; };
  }, [slug]);

  const tracks = useMemo(()=> widget?.tracks || [], [widget]);
  const current = tracks[idx];
  const srcUrl = (current?.url || current?.publicUrl || "").trim();

  // Preconnect hint (minim loading) – sekali saat mount
  useEffect(()=>{
    if (!srcUrl) return;
    try {
      const u = new URL(srcUrl);
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = `${u.protocol}//${u.host}`;
      document.head.appendChild(link);
      return ()=> document.head.removeChild(link);
    } catch {}
  }, [srcUrl]);

  // Autoplay: start muted, play on canplay; unmute on first gesture
  useEffect(()=>{
    const el = audioRef.current;
    if (!el) return;
    el.muted = true;              // agar autoplay selalu lolos
    setIsPlaying(false);
    const onCanPlay = async () => {
      try { await el.play(); setIsPlaying(true); } catch(e){ /* policy */ }
    };
    el.addEventListener("canplay", onCanPlay, { once:true });
    return ()=> el.removeEventListener("canplay", onCanPlay);
  }, [srcUrl]);

  // Controls
  function prev(){ setIdx(i => (i - 1 + tracks.length) % tracks.length); }
  function next(){ setIdx(i => (i + 1) % tracks.length); }

  async function ensureUnmutedAndPlay() {
    const el = audioRef.current; if (!el) return;
    try {
      // first gesture: unmute + play
      if (!everInteracted) setEverInteracted(true);
      el.muted = false;
      await el.play();
      setIsPlaying(true);
    } catch(e){ console.warn("play failed:", e); }
  }

  async function togglePlay() {
    const el = audioRef.current; if (!el) return;
    try {
      if (el.paused) { await ensureUnmutedAndPlay(); }
      else { el.pause(); setIsPlaying(false); }
    } catch(e){ console.warn(e); }
  }

  // auto-next
  const onEnded = ()=> next();

  // MIME hint
  const typeHint = (() => {
    const u = srcUrl.toLowerCase();
    if (u.endsWith(".mp3")) return "audio/mpeg";
    if (u.endsWith(".ogg")) return "audio/ogg";
    if (u.endsWith(".m4a") || u.endsWith(".mp4")) return "audio/mp4";
    return undefined;
  })();

  if (!open) return null;
  if (loading || !widget) {
    return <div className="fixed bottom-4 right-4 bg-white text-gray-900 rounded-md shadow-lg px-3 py-2 text-sm">Loading…</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating controls (di luar card) */}
      <div className="flex items-center gap-2 justify-end mb-2 pr-1">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          onMouseDown={()=> setEverInteracted(true)}
          title="Play/Pause"
          className="w-10 h-10 rounded-md bg-gray-900 text-white flex items-center justify-center hover:bg-black transition"
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        {/* Playlist toggle */}
        <button
          onClick={()=>{ setShowList(s=>!s); setEverInteracted(true); if (audioRef.current) audioRef.current.muted=false; }}
          title="Playlist"
          className="w-10 h-10 rounded-md bg-gray-200 text-gray-900 flex items-center justify-center hover:bg-gray-300 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zM4 11h10v2H4zM4 16h16v2H4z"/></svg>
        </button>

        {/* Close */}
        <button
          onClick={()=> setOpen(false)}
          title="Close"
          className="w-10 h-10 rounded-md bg-gray-200 text-gray-900 flex items-center justify-center hover:bg-gray-300 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.29 10.59 10.6l6.3-6.3z"/></svg>
        </button>
      </div>

      {/* Card putih (tanpa judul/teks) */}
      <div className="bg-white text-gray-900 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-200 w-[320px] overflow-hidden">
        {/* audio element hidden (kita kontrol via tombol) */}
        <audio
          ref={audioRef}
          key={srcUrl}
          preload="auto"
          crossOrigin="anonymous"
          onPlay={()=> setIsPlaying(true)}
          onPause={()=> setIsPlaying(false)}
          onEnded={onEnded}
          className="hidden"
        >
          {typeHint ? <source src={srcUrl} type={typeHint} /> : <source src={srcUrl} />}
        </audio>

        {/* Playlist naik ke atas (dengan bottom border) */}
        {showList && (
          <div className="border-b border-gray-200 max-h-60 overflow-auto">
            {tracks.map((t,i)=>{
              const active = i===idx;
              return (
                <button
                  key={t.id || i}
                  onClick={()=>{ setIdx(i); /* biarkan list tetap terbuka */ ensureUnmutedAndPlay(); }}
                  className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${active?"bg-gray-50":""}`}
                >
                  <div className={`w-9 h-9 rounded ${active?"bg-gray-900":"bg-gray-200"} flex items-center justify-center text-white`}>
                    {active ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${active?"text-gray-900":"text-gray-800"}`}>
                      {t.title || `Track ${i+1}`}
                    </div>
                    {t.artist && <div className="text-xs text-gray-500 truncate">{t.artist}</div>}
                  </div>
                  {Number.isFinite(t.duration_sec) && (
                    <div className="text-xs text-gray-500">
                      {Math.floor(t.duration_sec/60)}:{String(Math.floor(t.duration_sec%60)).padStart(2,"0")}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer tipis: indikator sederhana */}
        <div className="px-3 py-2 text-[11px] text-gray-500">
          {isPlaying ? "Playing…" : "Paused"}
        </div>
      </div>
    </div>
  );
}
