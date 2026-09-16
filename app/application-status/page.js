"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TabBar from "@/components/TabBar";
import StatusPill from "@/components/StatusPill";
import { createClient } from "@/lib/supabaseClient";

const MESSAGES = {
  pending: "Aplikasimu lagi direview tim curation. Kami akan kabari begitu keputusan keluar.",
  waitlist: "Kamu masuk waitlist untuk event ini — kami akan hubungi kalau ada slot kosong.",
  approved: "Selamat, kamu approved! Event Pass sudah bisa dibuka.",
  rejected: "Aplikasimu belum bisa kami lanjutkan untuk event ini.",
};

const STEPS = ["profile", "curation", "approved", "event"];
const STEP_LABEL = { profile: "PROFILE", curation: "CURATION", approved: "APPROVED", event: "EVENT" };

function stepIndexFor(status) {
  if (status === "approved") return 3;
  if (status === "pending" || status === "waitlist") return 1;
  return 0;
}

export default function ApplicationStatusPage() {
  const supabase = createClient();
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reg } = await supabase
        .from("registrations")
        .select("*, events(name, date)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRegistration(reg);
    })();
  }, []);

  if (!registration) {
    return (
      <div>
        <div className="container">
          <p className="muted">Belum ada aplikasi event.</p>
        </div>
        <TabBar />
      </div>
    );
  }

  const activeIdx = stepIndexFor(registration.status);
  const isApproved = registration.status === "approved";

  return (
    <div>
      <div className="container" style={{ paddingTop: 24 }}>
        <h1 style={{ fontSize: 28 }}>Application Status</h1>

        <div className="card" style={{ background: isApproved ? "var(--forest)" : "#fff", color: isApproved ? "#fff" : "var(--ink)" }}>
          <strong>{isApproved ? "YOU'RE IN." : registration.status === "waitlist" ? "WAITLISTED." : "UNDER REVIEW."}</strong>
          <p style={{ margin: "4px 0 0", opacity: isApproved ? 0.9 : 1 }}>{MESSAGES[registration.status]}</p>
        </div>

        <div style={{ display: "flex", gap: 6, margin: "6px 0 4px" }}>
          {STEPS.map((s, idx) => (
            <div key={s} style={{ flex: 1 }}>
              <div
                style={{
                  height: 5,
                  borderRadius: 4,
                  background: idx <= activeIdx ? "var(--terracotta)" : "var(--border)",
                }}
              />
              <p className="muted" style={{ fontSize: 11, margin: "4px 0 0", textAlign: "center" }}>
                {STEP_LABEL[s]}
              </p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <strong>{registration.events?.name}</strong>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {registration.events && new Date(registration.events.date).toLocaleDateString("id-ID", { dateStyle: "full" })}
          </p>
        </div>

        <div className="card">
          <strong>NEXT STEP</strong>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {isApproved
              ? "Simpan Event Pass kamu dan datang sebelum check-in ditutup."
              : "Tunggu keputusan curation — kami akan kabari lewat notifikasi."}
          </p>
        </div>

        {isApproved && (
          <Link href="/pass">
            <button className="btn btn-primary">VIEW EVENT PASS</button>
          </Link>
        )}
      </div>
      <TabBar />
    </div>
  );
}
