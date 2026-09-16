"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  date: "",
  location: "",
  price_rupiah: 0,
  cover_image_url: "",
  capacity: 20,
  round_duration_minutes: 6,
  number_of_rounds: 6,
};

export default function AdminEventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const path = `events/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("photos").getPublicUrl(path);
    setForm((f) => ({ ...f, cover_image_url: publicUrl.publicUrl }));
    setUploading(false);
  }

  async function load() {
    const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
    setEvents(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createEvent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error: insertError } = await supabase
      .from("events")
      .insert({ ...form, status: "draft" });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm(emptyForm);
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Events</h1>

      <div className="card">
        <strong>Buat event baru</strong>
        <form onSubmit={createEvent} style={{ marginTop: 12 }}>
          <div className="field">
            <label>Nama event</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Slug (untuk URL, mis. redate-01)</label>
            <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="field">
            <label>Deskripsi event</label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Cerita singkat tentang event ini — vibe, siapa yang cocok ikut, apa yang bakal terjadi..."
            />
          </div>
          <div className="field">
            <label>Tanggal & jam</label>
            <input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="field">
            <label>Cover image (foto venue/suasana event)</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} />
            {uploading && <p className="muted">Mengunggah...</p>}
            {form.cover_image_url && (
              <img
                src={form.cover_image_url}
                alt="preview"
                style={{ width: "100%", maxWidth: 300, borderRadius: 12, marginTop: 8 }}
              />
            )}
          </div>
          <div className="field">
            <label>Lokasi</label>
            <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="field">
            <label>Harga tiket (Rupiah, isi 0 kalau gratis)</label>
            <input
              required
              type="number"
              min={0}
              step={1000}
              value={form.price_rupiah}
              onChange={(e) => setForm({ ...form, price_rupiah: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label>Kapasitas</label>
            <input required type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Jumlah round</label>
            <input required type="number" value={form.number_of_rounds} onChange={(e) => setForm({ ...form, number_of_rounds: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label>Durasi per round (menit)</label>
            <input required type="number" value={form.round_duration_minutes} onChange={(e) => setForm({ ...form, round_duration_minutes: Number(e.target.value) })} />
          </div>
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? "Menyimpan..." : "BUAT EVENT"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Tanggal</th>
            <th>Harga</th>
            <th>Status</th>
            <th>Kapasitas</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id}>
              <td>{ev.name}</td>
              <td>{new Date(ev.date).toLocaleDateString("id-ID")}</td>
              <td>{ev.price_rupiah > 0 ? `Rp${ev.price_rupiah.toLocaleString("id-ID")}` : "Gratis"}</td>
              <td>{ev.status.replaceAll("_", " ")}</td>
              <td>{ev.capacity}</td>
              <td>
                <Link href={`/admin/events/${ev.id}`}>Kelola →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
