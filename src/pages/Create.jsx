import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Create() {
  
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [slug, setSlug] = useState(""); // hanya untuk info setelah selesai
  
  // minta signed URL + upload 1 file 
  async function uploadOneFile(file, slugArg, index) {
    const resp = await fetch("/api/upload-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        // KUNCI: kirim null di file pertama agar server generate slug baru
        slug: slugArg || null,
        index,
      }),
    }).then((r) => r.json());

    if (resp.error) throw new Error(resp.error);

    const { error: upErr } = await supabase.storage
      .from("audio")
      .uploadToSignedUrl(resp.path, resp.token, file);

    if (upErr) throw upErr;

    return {
      slug: resp.slug,
      orderIndex: resp.orderIndex,
      publicUrl: resp.publicUrl,
      fileType: resp.fileType || file.type || "audio/mpeg",
      title: file.name.replace(/\.[^.]+$/, ""), // default judul dari nama file
    };
  }

  async function handleUpload() {
    if (files.length === 0) return alert("Pilih dulu minimal 1 lagu");
    if (files.length > 3) return alert("Maksimal 3 lagu!");

    setStatus("Uploading...");
    try {
      let currentSlug = ""; // KUNCI: selalu kosong → slug baru setiap batch
      const uploaded = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadOneFile(file, currentSlug, i);
        currentSlug = result.slug; // slug dari file pertama dipakai untuk file berikutnya di batch INI
        uploaded.push(result);
      }

      setStatus("Menyimpan widget...");
      // Simpan metadata widget (STEP 12)
      const save = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: currentSlug,
          title: `My Widget ${currentSlug}`,
          tracks: uploaded
            .map((u) => ({
              orderIndex: u.orderIndex ?? 0,
              publicUrl: u.publicUrl,
              fileType: u.fileType,
              title: u.title,
            }))
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .slice(0, 3),
        }),
      }).then(async (r) => {
        const txt = await r.text();
        try {
          return JSON.parse(txt);
        } catch {
          throw new Error(`Non-JSON (${r.status})`);
        }
      });

      if (save?.error) throw new Error(save.error);

      setSlug(currentSlug);
      setStatus(`✅ Widget jadi! Buka /${currentSlug}`);

      // OPSIONAL: kalau mau fitur "lanjutkan widget lama"
      // localStorage.setItem("slug", currentSlug);
      // lalu tampilkan tombol "Lanjutkan" terpisah (tidak otomatis).
    } catch (err) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Create Widget</h1>

      <input
        type="file"
        accept="audio/mp3,audio/mpeg,audio/ogg,audio/m4a"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="mb-4"
      />

      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Upload & Buat Widget
        </button>

        {/* Tombol reset batch biar jelas mulai widget baru */}
        <button
          onClick={() => {
            setFiles([]);
            setSlug("");
            setStatus("Siap bikin widget baru.");
            // localStorage.removeItem("slug"); // kalau sebelumnya kamu simpan
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
        >
          New Widget
        </button>
      </div>

      <p className="mt-4">{status}</p>
      {slug && (
        <a href={`/${slug}`} className="mt-2 underline text-emerald-400">
          Buka widget /{slug}
        </a>
      )}
    </div>
  );
}
