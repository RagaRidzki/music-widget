const [muted, setMuted] = useState(true);

const tracks = useMemo(() => widget?.tracks || [], [widget]);
if (!tracks.length)
  return <div style={{ font: "14px system-ui", padding: 12 }}>No tracks.</div>;

async function toggle() {
  const el = audioRef.current;
  if (!el) return;
  try {
    if (el.paused) {
      el.muted = muted;
      await el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  } catch {}
}

<audio
  ref={audioRef}
  preload="auto"
  crossOrigin="anonymous"
  playsInline
  onPlay={() => setPlaying(true)}
  onPause={() => setPlaying(false)}
  onEnded={() => setIdx((i) => (i + 1) % tracks.length)}
>
  <source src={srcUrl} />
</audio>;
