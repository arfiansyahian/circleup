"use client";

import { useEffect, useState } from "react";
import TabBar from "@/components/TabBar";
import { createClient } from "@/lib/supabaseClient";

export default function MingleGamePage() {
  const supabase = createClient();
  const [challenges, setChallenges] = useState([]);
  const [done, setDone] = useState(new Set());
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: reg } = await supabase
        .from("registrations")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      if (!reg) return;

      const { data: cs } = await supabase
        .from("mingle_challenges")
        .select("*")
        .eq("event_id", reg.event_id)
        .order("sort_order");
      setChallenges(cs || []);

      const { data: progress } = await supabase
        .from("mingle_progress")
        .select("challenge_id")
        .eq("user_id", user.id);
      setDone(new Set((progress || []).map((p) => p.challenge_id)));
    })();
  }, []);

  async function toggle(challengeId) {
    if (done.has(challengeId)) return; // sekali selesai, tidak bisa dibatalkan (mencegah data ganda)
    await supabase.from("mingle_progress").insert({ user_id: userId, challenge_id: challengeId });
    setDone((prev) => new Set(prev).add(challengeId));
  }

  return (
    <div>
      <div className="container">
        <h1 style={{ fontSize: 28 }}>Mingle Game</h1>
        <p className="muted">Human Bingo — cari orang yang cocok dengan tantangan berikut, lalu tandai selesai.</p>

        {challenges.length === 0 && (
          <p className="muted">Belum ada challenge untuk event ini. Tunggu instruksi crew.</p>
        )}

        {challenges.map((c) => (
          <button
            key={c.id}
            className={`vote-option ${done.has(c.id) ? "selected" : ""}`}
            onClick={() => toggle(c.id)}
          >
            {done.has(c.id) ? "✅ " : "⬜ "}
            {c.label}
          </button>
        ))}
      </div>
      <TabBar />
    </div>
  );
}
