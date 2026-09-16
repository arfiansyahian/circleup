"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TabBar from "@/components/TabBar";
import { createClient } from "@/lib/supabaseClient";

export default function MyMatchesPage() {
  const supabase = createClient();
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [contacts, setContacts] = useState({});
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

      const contactMap = {};
      for (const m of ms || []) {
        const { data: revealed } = await supabase.rpc("reveal_contact", { p_match_id: m.id });
        contactMap[m.id] = (revealed || []).filter((r) => r.handle);
      }
      setContacts(contactMap);
    })();
  }, []);

  const eventName = matches[0]?.events?.name;

  return (
    <div>
      <div className="container">
        <h1 style={{ fontSize: 28 }}>My Matches</h1>

        {matches.length === 0 ? (
          <p className="muted">Belum ada mutual connection.</p>
        ) : (
          <div className="card" style={{ background: "var(--forest)", color: "#fff" }}>
            <p className="muted" style={{ color: "#dfe9e2", margin: 0 }}>EVENT RECAP</p>
            <strong>{matches.length} mutual match{matches.length > 1 ? "es" : ""} • {eventName}</strong>
          </div>
        )}

        {matches.map((m) => {
          const partnerId = m.user_a === userId ? m.user_b : m.user_a;
          const p = profiles[partnerId];
          const revealed = contacts[m.id] || [];
          return (
            <div key={m.id} className="card">
              <strong>{p?.nickname}</strong>
              <p className="muted" style={{ margin: "4px 0" }}>
                Mutual match • {revealed.length > 0 ? "Contact shared" : "Belum connect"}
              </p>

              {revealed.length > 0 ? (
                <div>
                  {revealed.map((r) => (
                    <span key={r.channel} className="chip selected" style={{ marginRight: 6 }}>
                      {r.channel === "instagram" ? "Instagram" : "WhatsApp"}: {r.handle}
                    </span>
                  ))}
                </div>
              ) : (
                <Link href={`/connect?match=${m.id}`}>
                  <button className="btn btn-secondary" style={{ marginTop: 8 }}>
                    LANJUT KE CONNECT
                  </button>
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <TabBar />
    </div>
  );
}
