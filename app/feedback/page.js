"use client";

import { useState } from "react";
import TabBar from "@/components/TabBar";
import { createClient } from "@/lib/supabaseClient";

const DIMENSIONS = [
  { key: "connection_score", label: "Connection" },
  { key: "comfort_score", label: "Comfort" },
  { key: "conversation_score", label: "Conversation" },
  { key: "overall_score", label: "Overall Experience" },
];

export default function FeedbackPage() {
  const supabase = createClient();
  const [scores, setScores] = useState({});
  const [wouldJoinAgain, setWouldJoinAgain] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: reg } = await supabase
      .from("registrations")
      .select("event_id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    if (!reg) return;

    await supabase.from("feedback").upsert(
      {
        event_id: reg.event_id,
        user_id: user.id,
        ...scores,
        would_join_again: wouldJoinAgain,
        notes,
      },
      { onConflict: "event_id,user_id" }
    );
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <div className="container" style={{ textAlign: "center", paddingTop: 80 }}>
          <h2>Terima kasih!</h2>
          <p className="muted">Feedback kamu membantu Re:Date berikutnya jadi lebih baik.</p>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div>
      <div className="container">
        <h1 style={{ fontSize: 28 }}>Feedback</h1>

        {DIMENSIONS.map((d) => (
          <div className="field" key={d.key}>
            <label>{d.label}</label>
            <div>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`chip ${scores[d.key] === n ? "selected" : ""}`}
                  onClick={() => setScores((s) => ({ ...s, [d.key]: n }))}
                  type="button"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="field">
          <label>Mau ikut Re:Date lagi?</label>
          <div>
            <button
              className={`chip ${wouldJoinAgain === true ? "selected" : ""}`}
              onClick={() => setWouldJoinAgain(true)}
              type="button"
            >
              Ya
            </button>
            <button
              className={`chip ${wouldJoinAgain === false ? "selected" : ""}`}
              onClick={() => setWouldJoinAgain(false)}
              type="button"
            >
              Tidak
            </button>
          </div>
        </div>

        <div className="field">
          <label>Catatan tambahan (opsional)</label>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button className="btn btn-primary" onClick={submit}>
          KIRIM FEEDBACK
        </button>
      </div>
      <TabBar />
    </div>
  );
}
