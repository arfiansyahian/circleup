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

  return (
    <div>
      <div className="container" style={{ textAlign: "center", paddingTop: 40 }}>
        <h1 style={{ fontSize: 28 }}>Application Status</h1>
        <div className="card">
          <StatusPill status={registration.status} />
          <h2 style={{ margin: "12px 0 4px" }}>{registration.events?.name}</h2>
          <p className="muted">
            {registration.events && new Date(registration.events.date).toLocaleDateString("id-ID", { dateStyle: "full" })}
          </p>
          <p style={{ marginTop: 14 }}>{MESSAGES[registration.status]}</p>

          {registration.status === "approved" && (
            <Link href="/pass">
              <button className="btn btn-primary" style={{ marginTop: 10 }}>
                VIEW PASS
              </button>
            </Link>
          )}
        </div>
      </div>
      <TabBar />
    </div>
  );
}
