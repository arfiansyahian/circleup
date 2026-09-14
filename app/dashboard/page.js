"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TabBar from "@/components/TabBar";
import StatusPill from "@/components/StatusPill";
import { createClient } from "@/lib/supabaseClient";

const STAGES = ["check_in", "opening", "mingle", "speed_dating", "chikology", "match_reveal"];

export default function DashboardPage() {
  const supabase = createClient();
  const [registration, setRegistration] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reg } = await supabase
        .from("registrations")
        .select("*, events(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setRegistration(reg);
      setEvent(reg?.events || null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <p className="muted">Memuat dashboard...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div>
        <div className="container">
          <h1 style={{ fontSize: 28 }}>Belum ada event</h1>
          <p className="muted">Kamu belum terdaftar di event manapun.</p>
          <Link href="/">
            <button className="btn btn-primary">CARI EVENT</button>
          </Link>
        </div>
        <TabBar />
      </div>
    );
  }

  const currentStageIndex = STAGES.indexOf(event?.status);

  const nextAction = () => {
    switch (event?.status) {
      case "check_in":
        return { href: "/pass", label: "BUKA EVENT PASS" };
      case "mingle":
        return { href: "/mingle", label: "MULAI MINGLE GAME" };
      case "speed_dating":
        return { href: "/speed-date", label: "MASUK SPEED DATE" };
      case "chikology":
        return { href: "/dashboard", label: "MENUNGGU SESI CHIKOLOGY" };
      case "match_reveal":
        return { href: "/match-reveal", label: "LIHAT MATCH REVEAL" };
      default:
        return { href: "/pass", label: "LIHAT EVENT PASS" };
    }
  };

  const action = nextAction();

  return (
    <div>
      <div className="container">
        <h1 style={{ fontSize: 28 }}>Halo, siap untuk hari ini?</h1>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{event?.name}</strong>
            <StatusPill status={registration.status} />
          </div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            {event && new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "full" })}
          </p>
        </div>

        {registration.status !== "approved" ? (
          <div className="card">
            <p style={{ margin: 0 }}>
              Status aplikasimu sedang <strong>{registration.status}</strong>. Kami akan
              mengabari begitu curation selesai.
            </p>
          </div>
        ) : (
          <>
            <div className="card">
              <p className="muted" style={{ marginTop: 0 }}>Progress hari ini</p>
              <div className="progress-track">
                {STAGES.map((s, idx) => (
                  <div key={s} className={`progress-step ${idx <= currentStageIndex ? "done" : ""}`} />
                ))}
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--forest)" }}>
                Tahap sekarang: {event?.status.replaceAll("_", " ")}
              </p>
            </div>

            <Link href={action.href}>
              <button className="btn btn-primary">{action.label}</button>
            </Link>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}
