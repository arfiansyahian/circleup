"use client";

import { useEffect, useState } from "react";
import TabBar from "@/components/TabBar";
import { createClient } from "@/lib/supabaseClient";

export default function ReferralPage() {
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);

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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API bisa gagal di beberapa browser — abaikan diam-diam
    }
  }

  async function inviteFriend() {
    const text = `Yuk ikutan CircleUp Re:Date! Pakai kode referral aku: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user cancel share sheet — fallback ke copy
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // abaikan
    }
  }

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
            <p className="muted" style={{ margin: 0 }}>Referrals</p>
            <p className="value">{referrals.length}</p>
          </div>
          <div className="kpi-card">
            <p className="muted" style={{ margin: 0 }}>Rewarded</p>
            <p className="value">{rewarded}</p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={copyCode}>
          {copied ? "TERSALIN ✓" : "COPY CODE"}
        </button>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={inviteFriend}>
          INVITE A FRIEND
        </button>

        <p className="muted" style={{ marginTop: 14 }}>Bagikan kode ini ke temanmu saat mereka mendaftar Re:Date berikutnya.</p>
      </div>
      <TabBar />
    </div>
  );
}
