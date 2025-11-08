import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Create() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [slug, setSlug] = useState("");

  // 🔹 fungsi uploadOneFile (copy dari kamu)
  async function uploadOneFile(file, slug, index) {
    // 1) minta intent ke server
    const resp = await fetch("/api/upload-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        slug,
        index,
      }),
    }).then((r) => r.json());

    if (resp.error) throw new Error(resp.error);

    // 2) kirim file ke signed url (pakai client SDK)
    const { error: upErr } = await supabase.storage
      .from("audio")
      .uploadToSignedUrl(resp.path, resp.token, file);

    if (upErr) throw upErr;

    // 3) simpan publicUrl untuk dipakai di /api/widgets nanti
    return {
      slug: resp.slug,
      orderIndex: resp.orderIndex,
      publicUrl: resp.publicUrl,
    };
  }

  // 🔹 handler saat user pilih file
  async function handleUpload() {
    if (files.length === 0) return alert("Pilih dulu minimal 1 lagu");
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
      setStatus(`✅ Selesai upload ${uploaded.length} lagu`);
      console.log(uploaded);
    } catch (err) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Create Widget</h1>

      {/* file input */}
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
        Upload Lagu
      </button>

      <p className="mt-4">{status}</p>
    </div>
  );
}
