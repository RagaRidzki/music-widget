// src/pages/Embed.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";

export default function Embed() {
  const { slug } = useParams();
  const [widget, setWidget] = useState(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/widgets?slug=${encodeURIComponent(slug)}`);
      const j = await r.json();
      setWidget(j.widget || null);
      setIdx(0);
    })();
  }, [slug]);

  const tracks = useMemo(() => widget?.tracks || [], [widget]);
  const current = tracks[idx];
  const srcUrl = current?.url || current?.publicUrl || "";

  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (el.paused) { await el.play(); setPlaying(true); }
      else { el.pause(); setPlaying(false); }
    } catch {}
  }

  if (!widget) return <div style={{font: '14px sans-serif'}}>Loading…</div>;

  return (
    <div style={{
      width: '100%', height: '100%',
      boxSizing: 'border-box',
      padding: 12, borderRadius: 12, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
    }}>
      <button onClick={toggle} title="Play/Pause" style={{width:40,height:40,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #e5e7eb',borderRadius:8,background:'#fff'}}>
        {playing ? '▮▮' : '▶'}
      </button>
      <div style={{flex:1, minWidth:0}}>
        <div style={{font: '600 14px/1.3 system-ui', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
          {current?.title || 'Track'}
        </div>
      </div>
      <audio
        ref={audioRef}
        preload="auto"
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setIdx((i)=> (i+1) % tracks.length)}
      >
        <source src={srcUrl}/>
      </audio>
    </div>
  );
}
