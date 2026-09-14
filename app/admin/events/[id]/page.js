"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

// Urutan status sesuai blueprint bab 15 — admin hanya bisa maju berurutan.
const STATUS_FLOW = [
  "draft",
  "open_registration",
  "registration_closed",
  "curation",
  "ready",
  "check_in",
  "opening",
  "mingle",
  "speed_dating",
  "chikology",
  "match_reveal",
  "closed",
];

export default function AdminEventDetailPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [event, setEvent] = useState(null);
  const [updating, setUpdating] = useState(false);

  async function load() {
    const { data } = await supabase.from("events").select("*").eq("id", id).single();
    setEvent(data);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function advanceStatus() {
    const idx = STATUS_FLOW.indexOf(event.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    setUpdating(true);
    await supabase.from("events").update({ status: next }).eq("id", id);
    await supabase.from("audit_log").insert({ action: "event_status_advance", target_table: "events", target_id: id, metadata: { to: next } });
    setUpdating(false);
    load();
  }

  if (!event) return <p className="muted">Memuat…</p>;

  const idx = STATUS_FLOW.indexOf(event.status);
  const next = STATUS_FLOW[idx + 1];

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>{event.name}</h1>
      <p className="muted">
        {event.location} • {new Date(event.date).toLocaleString("id-ID")}
      </p>

      <div className="card">
        <strong>Event status</strong>
        <div className="progress-track" style={{ marginTop: 10 }}>
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className={`progress-step ${i <= idx ? "done" : ""}`} title={s} />
          ))}
        </div>
        <p style={{ fontWeight: 700, color: "var(--forest)" }}>Sekarang: {event.status.replaceAll("_", " ")}</p>
        {next ? (
          <button className="btn btn-primary" disabled={updating} onClick={advanceStatus}>
            {updating ? "Memproses..." : `LANJUT KE: ${next.replaceAll("_", " ").toUpperCase()}`}
          </button>
        ) : (
          <p className="muted">Event sudah closed.</p>
        )}
      </div>

      <div className="card">
        <strong>Konfigurasi</strong>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Kapasitas: {event.capacity} • Jumlah round: {event.number_of_rounds} • Durasi/round:{" "}
          {event.round_duration_minutes} menit
        </p>
      </div>
    </div>
  );
}
