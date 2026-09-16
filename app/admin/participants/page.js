"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

function genCode() {
  return "RD-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default function AdminParticipantsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [role, setRole] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
        setRole(profile?.role || "crew");
      }
      const { data } = await supabase.from("events").select("id, name").order("date", { ascending: false });
      setEvents(data || []);
      if (data?.[0]) setEventId(data[0].id);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (eventId) load();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const { data, error: loadError } = await supabase
      .from("registrations")
      .select("*, profiles(nickname, full_name, age, city, occupation, dating_intent)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setRows(data || []);
  }

  async function setStatus(regId, status) {
    setBusyId(regId);
    setError("");
    const patch = { status };
    if (status === "approved") patch.participant_code = genCode();

    const { error: updateError } = await supabase.from("registrations").update(patch).eq("id", regId);
    if (updateError) {
      setError(`Gagal update status: ${updateError.message}`);
      setBusyId(null);
      return;
    }

    await supabase
      .from("audit_log")
      .insert({ action: "registration_status_change", target_table: "registrations", target_id: regId, metadata: { status } });

    setBusyId(null);
    load();
  }

  async function checkIn(regId) {
    setBusyId(regId);
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ checked_in_at: new Date().toISOString() })
      .eq("id", regId);
    setBusyId(null);
    if (updateError) {
      setError(`Gagal check-in: ${updateError.message}`);
      return;
    }
    load();
  }

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const isAdmin = role === "admin";

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>{isAdmin ? "Participants" : "Check-in"}</h1>
      <div className="gold-divider" style={{ marginTop: 0 }} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Semua status</option>
          <option value="pending">Under review</option>
          <option value="approved">Approved</option>
          <option value="waitlist">Waitlist</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nickname</th>
            <th>Umur</th>
            <th>Kota</th>
            <th>Intent</th>
            <th>Status</th>
            <th>Check-in</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/admin/participants/${r.id}`} style={{ textDecoration: "underline" }}>
                  {r.profiles?.nickname || "(profil belum lengkap)"}
                </Link>
              </td>
              <td>{r.profiles?.age}</td>
              <td>{r.profiles?.city}</td>
              <td>{r.profiles?.dating_intent}</td>
              <td>{r.status}</td>
              <td>{r.checked_in_at ? "✅" : "—"}</td>
              <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {isAdmin && (
                  <>
                    <button className="chip" disabled={busyId === r.id} onClick={() => setStatus(r.id, "approved")}>Approve</button>
                    <button className="chip" disabled={busyId === r.id} onClick={() => setStatus(r.id, "waitlist")}>Waitlist</button>
                    <button className="chip" disabled={busyId === r.id} onClick={() => setStatus(r.id, "rejected")}>Reject</button>
                  </>
                )}
                {r.status === "approved" && !r.checked_in_at && (
                  <button className="chip selected" disabled={busyId === r.id} onClick={() => checkIn(r.id)}>Check-in</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
