"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function VoteInner() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const roundId = params.get("round");
  const partnerId = params.get("partner");

  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const options = [
    { value: "interested", label: "♥ INTERESTED" },
    { value: "maybe", label: "? MAYBE" },
    { value: "not_for_me", label: "✕ NOT FOR ME" },
  ];

  async function submitVote() {
    if (!selected) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: round } = await supabase.from("rounds").select("event_id").eq("id", roundId).single();

    // upsert agar idempotent — double-submit tidak membuat record ganda (bab 18/19).
    await supabase.from("votes").upsert(
      {
        event_id: round.event_id,
        round_id: roundId,
        voter_id: user.id,
        candidate_id: partnerId,
        vote: selected,
      },
      { onConflict: "event_id,voter_id,candidate_id" }
    );

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => router.push("/speed-date"), 1200);
  }

  if (submitted) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: 100 }}>
        <h2>Vote tersimpan</h2>
        <p className="muted">Menunggu round berikutnya…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 26 }}>Bagaimana obrolannya?</h1>
      <p className="muted">Pilihanmu bersifat privat — tidak akan pernah dilihat siapapun.</p>

      {options.map((o) => (
        <button
          key={o.value}
          className={`vote-option ${selected === o.value ? "selected" : ""}`}
          onClick={() => setSelected(o.value)}
        >
          {o.label}
        </button>
      ))}

      <div className="card" style={{ background: "#f4d9d4", border: "none" }}>
        <strong style={{ color: "var(--terracotta)" }}>PRIVATE BY DEFAULT</strong>
        <p style={{ margin: "4px 0 0" }}>Nobody sees who you voted for. Mutual "Interested" creates a match.</p>
      </div>

      <button className="btn btn-primary" disabled={!selected || submitting} onClick={submitVote}>
        {submitting ? "Menyimpan..." : "KIRIM VOTE"}
      </button>
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={<div className="container">Memuat...</div>}>
      <VoteInner />
    </Suspense>
  );
}
