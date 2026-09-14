"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function MatchRevealPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

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
      if (!reg) return setLoading(false);

      const { data: ms } = await supabase
        .from("matches")
        .select("*")
        .eq("event_id", reg.event_id)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      setMatches(ms || []);

      const partnerIds = (ms || []).map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
      if (partnerIds.length > 0) {
        const { data: ps } = await supabase.from("profiles").select("*").in("user_id", partnerIds);
        const map = {};
        (ps || []).forEach((p) => (map[p.user_id] = p));
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="container">Memuat…</div>;

  return (
    <div className="container" style={{ textAlign: "center", paddingTop: 40 }}>
      <h1 style={{ fontSize: 34 }}>Match Reveal</h1>

      {matches.length === 0 ? (
        <p className="muted">
          Belum ada mutual match kali ini — tidak apa-apa, masih banyak circle berikutnya.
        </p>
      ) : (
        matches.map((m) => {
          const partnerId = m.user_a === userId ? m.user_b : m.user_a;
          const p = profiles[partnerId];
          return (
            <div key={m.id} className="card" style={{ background: "var(--forest)", color: "#fff" }}>
              <p className="pill pill-active" style={{ marginBottom: 10 }}>It's a Match</p>
              <h2 style={{ color: "#fff" }}>{p?.nickname}</h2>
              <Link href={`/connect?match=${m.id}`}>
                <button className="btn" style={{ background: "var(--gold)", color: "var(--forest)", marginTop: 10 }}>
                  LANJUT KE CONNECT
                </button>
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
}
