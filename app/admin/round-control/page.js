"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function AdminRoundControlPage() {
  const supabase = createClient();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [voteCount, setVoteCount] = useState(0);
  const [pairCount, setPairCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      setEvents(data || []);
      if (data?.[0]) setEventId(data[0].id);
    })();
  }, []);

  async function load() {
    if (!eventId) return;
    const { data: rs } = await supabase.from("rounds").select("*").eq("event_id", eventId).order("round_number");
    setRounds(rs || []);
    const active = (rs || []).find((r) => ["ready", "active", "time_up", "voting"].includes(r.status));
    setActiveRound(active || null);

    if (active) {
      const { count: pc } = await supabase
        .from("pairings")
        .select("*", { count: "exact", head: true })
        .eq("round_id", active.id);
      setPairCount(pc || 0);

      const { count: vc } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("round_id", active.id);
      setVoteCount(vc || 0);
    }
  }

  useEffect(() => {
    load();
    if (!eventId) return;
    const channel = supabase
      .channel(`round-control-${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds", filter: `event_id=eq.${eventId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startRound() {
    if (!activeRound) return;
    await supabase
      .from("rounds")
      .update({ status: "active", server_start_at: new Date().toISOString() })
      .eq("id", activeRound.id);
  }

  async function pauseRound() {
    // MVP: pause = kembali ke 'ready' tanpa server_start_at, admin start ulang saat siap.
    if (!activeRound) return;
    await supabase.from("rounds").update({ status: "ready", server_start_at: null }).eq("id", activeRound.id);
  }

  async function endRound() {
    if (!activeRound) return;
    await supabase.from("rounds").update({ status: "voting" }).eq("id", activeRound.id);
  }

  async function completeAndNext() {
    if (!activeRound) return;
    await supabase.from("rounds").update({ status: "completed" }).eq("id", activeRound.id);
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Round Control & Live Monitor</h1>
      <div className="gold-divider" style={{ marginTop: 0 }} />

      <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ marginBottom: 16 }}>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.name}</option>
        ))}
      </select>

      {!activeRound ? (
        <p className="muted">Tidak ada round aktif. Buat & kunci pairing dulu di halaman Pairing.</p>
      ) : (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Round {activeRound.round_number}</strong>
            <span className="pill pill-active">{activeRound.status.replaceAll("_", " ")}</span>
          </div>

          <div className="kpi-grid" style={{ marginTop: 14 }}>
            <div className="kpi-card">
              <p className="muted" style={{ margin: 0 }}>Pasangan aktif</p>
              <p className="value">{pairCount}</p>
            </div>
            <div className="kpi-card">
              <p className="muted" style={{ margin: 0 }}>Vote masuk</p>
              <p className="value">{voteCount} / {pairCount * 2}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn btn-primary" style={{ width: "auto" }} onClick={startRound} disabled={activeRound.status === "active"}>
              START
            </button>
            <button className="btn btn-secondary" style={{ width: "auto" }} onClick={pauseRound}>
              PAUSE
            </button>
            <button className="btn btn-secondary" style={{ width: "auto" }} onClick={endRound}>
              END (TIME'S UP)
            </button>
            <button className="btn btn-danger" style={{ width: "auto" }} onClick={completeAndNext}>
              COMPLETE ROUND
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <strong>Semua round</strong>
        <table className="admin-table">
          <thead><tr><th>Round</th><th>Status</th></tr></thead>
          <tbody>
            {rounds.map((r) => (
              <tr key={r.id}><td>{r.round_number}</td><td>{r.status}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
