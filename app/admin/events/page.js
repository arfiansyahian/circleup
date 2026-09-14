"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function AdminEventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    date: "",
    location: "",
    capacity: 20,
    round_duration_minutes: 6,
    number_of_rounds: 6,
  });
  const [saving, setSaving] = useState(false);

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
    await supabase.from("events").insert({ ...form, status: "draft" });
    setSaving(false);
    setForm({ name: "", slug: "", date: "", location: "", capacity: 20, round_duration_minutes: 6, number_of_rounds: 6 });
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
            <label>Tanggal & jam</label>
            <input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="field">
            <label>Lokasi</label>
            <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
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
        </form>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Tanggal</th>
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
