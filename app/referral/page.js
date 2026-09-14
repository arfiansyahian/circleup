"use client";

import { useEffect, useState } from "react";
import TabBar from "@/components/TabBar";
import { createClient } from "@/lib/supabaseClient";

export default function ReferralPage() {
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setCode(user.id.slice(0, 8).toUpperCase());

      const { data } = await supabase.from("referrals").select("*").eq("referrer_id", user.id);
      setReferrals(data || []);
    })();
  }, []);

  const rewarded = referrals.filter((r) => r.reward_status === "rewarded").length;

  return (
    <div>
      <div className="container">
        <h1 style={{ fontSize: 28 }}>Referral</h1>
        <div className="card" style={{ textAlign: "center", background: "var(--forest)", color: "#fff" }}>
          <p className="muted" style={{ color: "#dfe9e2" }}>Kode referral kamu</p>
          <h2 style={{ color: "#fff", letterSpacing: 3 }}>{code}</h2>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card">
            <p className="muted" style={{ margin: 0 }}>Total referral</p>
            <p className="value">{referrals.length}</p>
          </div>
          <div className="kpi-card">
            <p className="muted" style={{ margin: 0 }}>Rewarded</p>
            <p className="value">{rewarded}</p>
          </div>
        </div>
        <p className="muted">Bagikan kode ini ke temanmu saat mereka mendaftar Re:Date berikutnya.</p>
      </div>
      <TabBar />
    </div>
  );
}
