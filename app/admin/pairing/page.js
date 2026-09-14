"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { generatePairing, collectPreviousPairKeys } from "@/lib/pairing";

export default function AdminPairingPage() {
  const supabase = createClient();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [event, setEvent] = useState(null);
  const [existingRounds, setExistingRounds] = useState([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [duration, setDuration] = useState(6);
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState(null); // {pairs, leftover, profileMap}
  const [locking, setLocking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      setEvents(data || []);
      if (data?.[0]) setEventId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", eventId).single();
      setEvent(ev);
      setDuration(ev?.round_duration_minutes || 6);
      const { data: rounds } = await supabase
        .from("rounds")
        .select("*")
        .eq("event_id", eventId)
        .order("round_number");
      setExistingRounds(rounds || []);
      setRoundNumber((rounds?.length || 0) + 1);
    })();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    setMessage("");
    const { data: eligible } = await supabase
      .from("registrations")
      .select("user_id, profiles(nickname)")
      .eq("event_id", eventId)
      .eq("status", "approved")
      .not("checked_in_at", "is", null);

    if (!eligible || eligible.length < 2) {
      setMessage("Peserta checked-in belum cukup untuk membuat pairing.");
      return;
    }

    const roundIds = existingRounds.map((r) => r.id);
    let previousPairings = [];
    if (roundIds.length > 0) {
      const { data: pp } = await supabase
        .from("pairings")
        .select("participant_a, participant_b")
        .in("round_id", roundIds)
        .eq("locked", true);
      previousPairings = pp || [];
    }

    const ids = eligible.map((e) => e.user_id);
    const result = generatePairing(ids, collectPreviousPairKeys(previousPairings));

    const profileMap = {};
    eligible.forEach((e) => (profileMap[e.user_id] = e.profiles?.nickname || e.user_id.slice(0, 6)));

    setPreview({ ...result, profileMap });

    if (result.leftover.length > 0) {
      setMessage(
        `${result.leftover.length} peserta tidak mendapat pasangan di alternatif ini (kemungkinan sudah bertemu semua orang lain, atau jumlah ganjil). Coba Generate Ulang atau lakukan override manual.`
      );
    }
  }

  async function handleLock() {
    if (!preview) return;
    setLocking(true);

    let round = existingRounds.find((r) => r.round_number === roundNumber);
    if (!round) {
      const { data: newRound } = await supabase
        .from("rounds")
        .insert({
          event_id: eventId,
          round_number: roundNumber,
          duration_seconds: duration * 60,
          prompt,
          status: "ready",
        })
        .select()
        .single();
      round = newRound;
    }

    // hapus pairing lama untuk round ini (jika regenerate) lalu insert baru & lock
    await supabase.from("pairings").delete().eq("round_id", round.id);
    await supabase.from("pairings").insert(
      preview.pairs.map(([a, b], idx) => ({
        round_id: round.id,
        participant_a: a,
        participant_b: b,
        table_number: idx + 1,
        locked: true,
      }))
    );

    await supabase
      .from("audit_log")
      .insert({ action: "pairing_locked", target_table: "rounds", target_id: round.id, metadata: { pairs: preview.pairs.length } });

    setLocking(false);
    setMessage(`Round ${roundNumber} pairing terkunci — ${preview.pairs.length} pasangan siap.`);
    setPreview(null);
    const { data: rounds } = await supabase.from("rounds").select("*").eq("event_id", eventId).order("round_number");
    setExistingRounds(rounds || []);
  }

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Pairing Management</h1>

      <div className="card">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={roundNumber}
            onChange={(e) => setRoundNumber(Number(e.target.value))}
            style={{ width: 100 }}
            title="Round number"
          />
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={{ width: 100 }}
            title="Durasi (menit)"
          />
          <input
            placeholder="Conversation prompt (opsional)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
        </div>
        <button className="btn btn-secondary" onClick={handleGenerate}>GENERATE PAIRING</button>
      </div>

      {message && <p className="muted">{message}</p>}

      {preview && (
        <div className="card">
          <strong>Preview — Round {roundNumber} ({preview.pairs.length} pasangan)</strong>
          <table className="admin-table">
            <thead>
              <tr><th>Meja</th><th>Peserta A</th><th>Peserta B</th></tr>
            </thead>
            <tbody>
              {preview.pairs.map(([a, b], idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{preview.profileMap[a]}</td>
                  <td>{preview.profileMap[b]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.leftover.length > 0 && (
            <p className="error-text">
              Tanpa pasangan: {preview.leftover.map((id) => preview.profileMap[id]).join(", ")}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button className="btn btn-secondary" onClick={handleGenerate}>REGENERATE</button>
            <button className="btn btn-primary" disabled={locking} onClick={handleLock}>
              {locking ? "Mengunci..." : "REVIEW OK, LOCK PAIRING"}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <strong>Round tersimpan</strong>
        <table className="admin-table">
          <thead><tr><th>Round</th><th>Status</th><th>Durasi</th></tr></thead>
          <tbody>
            {existingRounds.map((r) => (
              <tr key={r.id}>
                <td>{r.round_number}</td>
                <td>{r.status}</td>
                <td>{Math.round(r.duration_seconds / 60)} menit</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
