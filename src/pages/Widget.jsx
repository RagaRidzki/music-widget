// src/pages/Widget.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function Widget() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [widget, setWidget] = useState(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      try {
        const resp = await fetch(`/api/widgets?slug=${encodeURIComponent(slug)}`).then(r => r.json());
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

  function prev() {
    setIdx(i => (i - 1 + tracks.length) % tracks.length);
  }
  function next() {
    setIdx(i => (i + 1) % tracks.length);
  }

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

  const current = tracks[idx];

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
          key={current?.publicUrl} // force reload saat ganti track
          className="w-full mb-4"
          src={current?.publicUrl}
          controls
          preload="metadata"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
          >
            Prev
          </button>
          <button
            onClick={next}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
          >
            Next
          </button>
          <Link
            to="/create"
            className="ml-auto px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700"
          >
            Create another
          </Link>
        </div>
      </div>
    </div>
  );
}
