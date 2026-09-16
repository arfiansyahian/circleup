"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { calculateMutualMatches } from "@/lib/matching";

export default function AdminMatchesPage() {
  const supabase = createClient();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [matches, setMatches] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      setEvents(data || []);
      if (data?.[0]) setEventId(data[0].id);
    })();
  }, []);

  async function load() {
    if (!eventId) return;
    const { data: ms } = await supabase.from("matches").select("*").eq("event_id", eventId);
    setMatches(ms || []);

    const ids = new Set();
    (ms || []).forEach((m) => { ids.add(m.user_a); ids.add(m.user_b); });
    if (ids.size > 0) {
      const { data: ps } = await supabase.from("profiles").select("user_id, nickname").in("user_id", [...ids]);
      const map = {};
      (ps || []).forEach((p) => (map[p.user_id] = p.nickname));
      setProfileMap(map);
    }
  }

  useEffect(() => { load(); }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function calculateAndReveal() {
    setCalculating(true);
    setMessage("");

    const { data: votes } = await supabase.from("votes").select("voter_id, candidate_id, vote").eq("event_id", eventId);
    const pairs = calculateMutualMatches(votes || []);

    if (pairs.length > 0) {
      await supabase.from("matches").upsert(
        pairs.map(([a, b]) => ({ event_id: eventId, user_a: a, user_b: b })),
        { onConflict: "event_id,user_a,user_b" }
      );
    }

    // Reveal timing dikontrol admin (bab 11) — transisi event ke match_reveal.
    await supabase.from("events").update({ status: "match_reveal" }).eq("id", eventId);
    await supabase.from("audit_log").insert({ action: "match_reveal", target_table: "events", target_id: eventId, metadata: { count: pairs.length } });

    setMessage(`${pairs.length} mutual match ditemukan dan di-reveal ke peserta.`);
    setCalculating(false);
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Matches</h1>
      <div className="gold-divider" style={{ marginTop: 0 }} />

      <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ marginBottom: 16 }}>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.name}</option>
        ))}
      </select>

      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Jalankan ini setelah seluruh voting event selesai — sesuai prinsip closing moment (bab 11).
        </p>
        <button className="btn btn-primary" style={{ width: "auto" }} disabled={calculating} onClick={calculateAndReveal}>
          {calculating ? "Menghitung..." : "CALCULATE & REVEAL MATCHES"}
        </button>
        {message && <p className="muted" style={{ marginTop: 10 }}>{message}</p>}
      </div>

      <table className="admin-table">
        <thead><tr><th>Peserta A</th><th>Peserta B</th><th>Connection status</th></tr></thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <td>{profileMap[m.user_a]}</td>
              <td>{profileMap[m.user_b]}</td>
              <td>{m.connection_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
