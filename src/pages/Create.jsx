// src/pages/Create.jsx (atau sesuai struktur kamu)
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Create() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [slug, setSlug] = useState(() => localStorage.getItem("slug") || "");
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  if (slug) localStorage.setItem("slug", slug);

  async function uploadOneFile(file, slugArg, index) {
    // 1) request signed intent
    const resp = await fetch("/api/upload-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        slug: slugArg,
        index,
      }),
    }).then(r => r.json());

    if (resp.error) throw new Error(resp.error);

    // 2) upload ke signed url via SDK
    const { error: upErr } = await supabase.storage
      .from("audio")
      .uploadToSignedUrl(resp.path, resp.token, file);

    if (upErr) throw upErr;

    // 3) kembalikan info buat metadata
    return {
      slug: resp.slug,
      orderIndex: resp.orderIndex,
      publicUrl: resp.publicUrl,
      fileType: resp.fileType,
      title: file.name.replace(/\.[^.]+$/, ""), // optional default title
    };
  }

  async function handleUpload() {
    if (files.length === 0) return alert("Pilih minimal 1 lagu");
    if (files.length > 3) return alert("Maksimal 3 lagu!");

    setStatus("Uploading...");
    try {
      let currentSlug = slug;
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadOneFile(file, currentSlug, i);
        currentSlug = result.slug;
        uploaded.push(result);
      }

      setSlug(currentSlug);

      // === STEP 12: SAVE METADATA ===
      setStatus("Menyimpan metadata…");
      const save = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: title || `My Widget ${currentSlug}`,
          tracks: uploaded.map(u => ({
            orderIndex: u.orderIndex,
            publicUrl: u.publicUrl,
            fileType: u.fileType,
            title: u.title,
          })),
        }),
      }).then(r => r.json());

      if (save.error) throw new Error(save.error);

      setStatus(`✅ Berhasil! Buka /${currentSlug}`);
      // optional: simpan slug agar sesi berikutnya nyambung
      localStorage.setItem("slug", currentSlug);

      // redirect ke halaman widget player
      navigate(`/${currentSlug}`);
    } catch (err) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-2">Create Widget</h1>
      <p className="text-sm opacity-80 mb-4">Upload 1–3 lagu lalu simpan sebagai widget.</p>

      <input
        type="text"
        placeholder="Judul widget (opsional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="mb-3 px-3 py-2 rounded bg-gray-800 border border-gray-700 w-80"
      />

      <input
        type="file"
        accept="audio/mp3,audio/mpeg,audio/ogg,audio/m4a"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="mb-4"
      />

      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
      >
        Upload & Simpan
      </button>

      <p className="mt-4">{status}</p>
    </div>
  );
}
