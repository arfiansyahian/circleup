"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function AdminAnalyticsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      setEvents(data || []);
      if (data?.[0]) setEventId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (eventId) load();
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    const { count: registered } = await supabase
      .from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId);
    const { count: approved } = await supabase
      .from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "approved");
    const { count: checkedIn } = await supabase
      .from("registrations").select("*", { count: "exact", head: true }).eq("event_id", eventId).not("checked_in_at", "is", null);
    const { data: votes } = await supabase.from("votes").select("vote").eq("event_id", eventId);
    const { count: matches } = await supabase
      .from("matches").select("*", { count: "exact", head: true }).eq("event_id", eventId);
    const { data: feedbacks } = await supabase.from("feedback").select("*").eq("event_id", eventId);

    const voteBreakdown = { interested: 0, maybe: 0, not_for_me: 0 };
    (votes || []).forEach((v) => voteBreakdown[v.vote]++);

    const avg = (key) => {
      const list = (feedbacks || []).map((f) => f[key]).filter((v) => v != null);
      return list.length ? (list.reduce((a, b) => a + b, 0) / list.length).toFixed(1) : "-";
    };

    setMetrics({
      registered: registered || 0,
      approved: approved || 0,
      checkedIn: checkedIn || 0,
      approvalRate: registered ? Math.round(((approved || 0) / registered) * 100) : 0,
      checkInRate: approved ? Math.round(((checkedIn || 0) / approved) * 100) : 0,
      voteBreakdown,
      votesPerParticipant: checkedIn ? ((votes || []).length / checkedIn).toFixed(1) : "-",
      matches: matches || 0,
      matchRate: checkedIn ? Math.round(((matches || 0) / checkedIn) * 100) : 0,
      avgComfort: avg("comfort_score"),
      avgConversation: avg("conversation_score"),
      repeatIntention: feedbacks?.length
        ? Math.round((feedbacks.filter((f) => f.would_join_again).length / feedbacks.length) * 100)
        : "-",
    });
  }

  if (!metrics) return <p className="muted">Memuat…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 28 }}>Analytics</h1>
      <div className="gold-divider" style={{ marginTop: 0 }} />

      <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ marginBottom: 16 }}>
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>{ev.name}</option>
        ))}
      </select>

      <div className="kpi-grid">
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Total registered</p><p className="value">{metrics.registered}</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Approval rate</p><p className="value">{metrics.approvalRate}%</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Check-in rate</p><p className="value">{metrics.checkInRate}%</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Votes / participant</p><p className="value">{metrics.votesPerParticipant}</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Mutual match count</p><p className="value">{metrics.matches}</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Match rate</p><p className="value">{metrics.matchRate}%</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Avg. comfort score</p><p className="value">{metrics.avgComfort}</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Avg. conversation score</p><p className="value">{metrics.avgConversation}</p></div>
        <div className="kpi-card"><p className="muted" style={{ margin: 0 }}>Repeat intention</p><p className="value">{metrics.repeatIntention}%</p></div>
      </div>

      <div className="card">
        <strong>Connection sentiment</strong>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Interested: {metrics.voteBreakdown.interested} • Maybe: {metrics.voteBreakdown.maybe} • Not for me:{" "}
          {metrics.voteBreakdown.not_for_me}
        </p>
      </div>
    </div>
  );
}
