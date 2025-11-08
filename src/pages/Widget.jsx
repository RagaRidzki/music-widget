// src/pages/Widget.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function Widget() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [widget, setWidget] = useState(null);
  const [idx, setIdx] = useState(0);
  const audioRef = useRef(null);
  const [dbg, setDbg] = useState("");

  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      try {
        const resp = await fetch(`/api/widgets?slug=${encodeURIComponent(slug)}`).then(async (r) => {
          const text = await r.text();
          try { return JSON.parse(text); }
          catch { return { error: `Non-JSON (${r.status})`, raw: text }; }
        });
        if (!active) return;
        if (resp.error) throw new Error(resp.error);
        setWidget(resp.widget);
        setIdx(0);
      } catch (e) {
        console.error(e);
        setWidget(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => { active = false; };
  }, [slug]);

  const tracks = useMemo(() => widget?.tracks || [], [widget]);
  const current = tracks[idx];

  // autoplay on track change
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const tryPlay = async () => {
      try { await el.play(); }
      catch (e) { setDbg(`autoplay blocked: ${e?.message || e}`); }
    };
    const t = setTimeout(tryPlay, 50);
    return () => clearTimeout(t);
  }, [current?.url, current?.publicUrl]);

  function prev() { setIdx(i => (i - 1 + tracks.length) % tracks.length); }
  function next() { setIdx(i => (i + 1) % tracks.length); }

  const onLoadedMeta = (e) => {
    setDbg(`loadedmetadata: ${e.target.duration?.toFixed?.(2) ?? "n/a"} sec`);
  };
  const onCanPlay = () => setDbg(prev => (prev ? prev + " | canplay" : "canplay"));
  const onPlay = () => setDbg(prev => (prev ? prev + " | play" : "play"));
  const onError = (e) => {
    const el = e.target;
    const err = el.error;
    setDbg(`error: code=${err?.code} networkState=${el.networkState}`);
    console.error("AUDIO ERROR", {
      code: err?.code, message: err?.message, networkState: el.networkState, src: el.currentSrc
    });
  };

  // source helper (support url/publicUrl)
  const srcUrl = (current?.url || current?.publicUrl || "").trim();

  const guessType = () => {
    const u = srcUrl.toLowerCase();
    if (u.endsWith(".mp3")) return "audio/mpeg";
    if (u.endsWith(".ogg")) return "audio/ogg";
    if (u.endsWith(".m4a") || u.endsWith(".mp4")) return "audio/mp4";
    return undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white">
        <div className="animate-pulse">Loading widget…</div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 text-white gap-3">
        <div className="text-xl">Widget tidak ditemukan</div>
        <Link className="underline" to="/create">Buat baru</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white p-6">
      <div className="w-full max-w-xl rounded-2xl bg-gray-900 p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{widget.title || `Widget ${widget.slug}`}</h1>
          <span className="text-sm opacity-70">/{widget.slug}</span>
        </div>

        <div className="mb-4">
          <div className="text-sm opacity-80 mb-1">
            Track {idx + 1} dari {tracks.length}
          </div>
          <div className="text-lg font-semibold">
            {current?.title || `Track ${idx + 1}`}
          </div>
        </div>

        <audio
          ref={audioRef}
          key={srcUrl}
          className="w-full mb-2"
          controls
          autoPlay
          preload="auto"
          crossOrigin="anonymous"
          onLoadedMetadata={onLoadedMeta}
          onCanPlay={onCanPlay}
          onPlay={onPlay}
          onError={onError}
        >
          {/* beri hint type untuk bantu decoding */}
          {guessType() ? <source src={srcUrl} type={guessType()} /> : <source src={srcUrl} />}
        </audio>

        <div className="text-xs opacity-70 mt-2 whitespace-pre-wrap break-all">{dbg}</div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={prev} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600">Prev</button>
          <button onClick={next} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">Next</button>
          <Link to="/create" className="ml-auto px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700">
            Create another
          </Link>
        </div>
      </div>
    </div>
  );
}
