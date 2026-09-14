"use client";

import { useEffect, useState } from "react";
import TabBar from "@/components/TabBar";
import { createClient } from "@/lib/supabaseClient";

export default function MyMatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: ms } = await supabase
        .from("matches")
        .select("*, events(name)")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("matched_at", { ascending: false });
      setMatches(ms || []);

      const partnerIds = (ms || []).map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
      if (partnerIds.length > 0) {
        const { data: ps } = await supabase.from("profiles").select("*").in("user_id", partnerIds);
        const map = {};
        (ps || []).forEach((p) => (map[p.user_id] = p));
        setProfiles(map);
      }
    })();
  }, []);

  return (
    <div>
      <div className="container">
        <h1 style={{ fontSize: 28 }}>My Matches</h1>
        {matches.length === 0 && <p className="muted">Belum ada mutual connection.</p>}
        {matches.map((m) => {
          const partnerId = m.user_a === userId ? m.user_b : m.user_a;
          const p = profiles[partnerId];
          return (
            <div key={m.id} className="card">
              <strong>{p?.nickname}</strong>
              <p className="muted" style={{ margin: "4px 0" }}>{m.events?.name}</p>
              <span className="pill pill-approved">{m.connection_status.replaceAll("_", " ")}</span>
            </div>
          );
        })}
      </div>
      <TabBar />
    </div>
  );
}
