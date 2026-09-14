"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const supabase = createClient();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState({ registered: 0, checkedIn: 0, matches: 0 });
  const [currentRound, setCurrentRound] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ev) return;
      setEvent(ev);

      const { count: registered } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", ev.id)
        .eq("status", "approved");

      const { count: checkedIn } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", ev.id)
        .not("checked_in_at", "is", null);

      const { count: matches } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("event_id", ev.id);

      const { data: round } = await supabase
        .from("rounds")
        .select("*")
        .eq("event_id", ev.id)
        .order("round_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      setStats({ registered: registered || 0, checkedIn: checkedIn || 0, matches: matches || 0 });
      setCurrentRound(round);
    })();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 30 }}>Admin Dashboard</h1>
      <p className="muted">{event?.name || "Belum ada event"}</p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="muted" style={{ margin: 0 }}>Approved participants</p>
          <p className="value">{stats.registered}</p>
        </div>
        <div className="kpi-card">
          <p className="muted" style={{ margin: 0 }}>Checked in</p>
          <p className="value">{stats.checkedIn}</p>
        </div>
        <div className="kpi-card">
          <p className="muted" style={{ margin: 0 }}>Current round</p>
          <p className="value">{currentRound ? currentRound.round_number : "-"}</p>
        </div>
        <div className="kpi-card">
          <p className="muted" style={{ margin: 0 }}>Mutual matches</p>
          <p className="value">{stats.matches}</p>
        </div>
      </div>

      <div className="card">
        <strong>Aksi cepat</strong>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <Link href="/admin/participants"><button className="btn btn-secondary">Review curation</button></Link>
          <Link href="/admin/pairing"><button className="btn btn-secondary">Generate pairing</button></Link>
          <Link href="/admin/round-control"><button className="btn btn-secondary">Buka round control</button></Link>
        </div>
      </div>
    </div>
  );
}
