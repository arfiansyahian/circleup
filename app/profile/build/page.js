"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabaseClient";

const INTEREST_OPTIONS = [
  "Film", "Musik", "Traveling", "Kuliner", "Olahraga", "Seni", "Baca Buku",
  "Fotografi", "Gaming", "Hiking", "Kopi", "Fashion", "Startup", "Yoga", "Menulis",
];

const INTENTS = [
  { value: "casual", label: "Casual" },
  { value: "serious", label: "Serious" },
  { value: "open_to_both", label: "Open to both" },
];

function BuildProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const eventId = params.get("event") || "";
  const supabase = createClient();
  const [form, setForm] = useState({
    occupation: "",
    photo_url: "",
    ask_me_about: "",
    currently_into: "",
    dating_intent: "",
  });
  const [interests, setInterests] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleInterest(name) {
    setInterests((prev) => {
      if (prev.includes(name)) return prev.filter((i) => i !== name);
      if (prev.length >= 5) return prev;
      return [...prev, name];
    });
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format foto harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5MB.");
      return;
    }

    setUploading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const path = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, {
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("photos").getPublicUrl(path);
    setForm((f) => ({ ...f, photo_url: publicUrl.publicUrl }));
    setUploading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ ...form, onboarded: true })
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // simpan interests: hapus lama, insert baru
    await supabase.from("user_interests").delete().eq("user_id", user.id);
    if (interests.length > 0) {
      const { data: rows } = await supabase
        .from("interests")
        .select("id, name")
        .in("name", interests);
      const existingNames = (rows || []).map((r) => r.name);
      const missing = interests.filter((i) => !existingNames.includes(i));
      let allRows = rows || [];
      if (missing.length > 0) {
        const { data: inserted } = await supabase
          .from("interests")
          .insert(missing.map((name) => ({ name })))
          .select("id, name");
        allRows = [...allRows, ...(inserted || [])];
      }
      await supabase.from("user_interests").insert(
        allRows.map((r) => ({ user_id: user.id, interest_id: r.id }))
      );
    }

    setSaving(false);
    const qs = eventId ? `?event=${eventId}` : "";
    router.push(`/profile/preview${qs}`);
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="progress-track">
          <div className="progress-step done" />
          <div className="progress-step done" />
          <div className="progress-step" />
        </div>
        <h1 style={{ fontSize: 30 }}>Build Profile</h1>
        <p className="muted">
          Kami hanya mengumpulkan info yang membantu curation dan percakapan — bukan swipe profile.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Pekerjaan</label>
            <input
              required
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Foto profil</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoUpload} />
            {uploading && <p className="muted">Mengunggah foto...</p>}
            {form.photo_url && (
              <img
                src={form.photo_url}
                alt="preview"
                style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover", marginTop: 8 }}
              />
            )}
          </div>

          <div className="field">
            <label>Interests (maks. 5)</label>
            <div>
              {INTEREST_OPTIONS.map((i) => (
                <span
                  key={i}
                  className={`chip ${interests.includes(i) ? "selected" : ""}`}
                  onClick={() => toggleInterest(i)}
                  style={{ cursor: "pointer" }}
                >
                  {i}
                </span>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Ask me about…</label>
            <input
              value={form.ask_me_about}
              onChange={(e) => setForm({ ...form, ask_me_about: e.target.value })}
              placeholder="mis. Rencana solo-trip tahun ini"
            />
          </div>

          <div className="field">
            <label>Currently into… (opsional)</label>
            <input
              value={form.currently_into}
              onChange={(e) => setForm({ ...form, currently_into: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Dating intent (privat, untuk curation)</label>
            <select
              required
              value={form.dating_intent}
              onChange={(e) => setForm({ ...form, dating_intent: e.target.value })}
            >
              <option value="">Pilih</option>
              {INTENTS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? "Menyimpan..." : "PREVIEW PROFILE"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BuildProfilePage() {
  return (
    <Suspense fallback={<div className="container">Memuat...</div>}>
      <BuildProfileInner />
    </Suspense>
  );
}
