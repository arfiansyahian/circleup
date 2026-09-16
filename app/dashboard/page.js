"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TabBar from "@/components/TabBar";
import StatusPill from "@/components/StatusPill";
import { createClient } from "@/lib/supabaseClient";

const STAGES = [
  { key: "opening", label: "OPENING" },
  { key: "mingle", label: "MINGLE" },
  { key: "speed_dating", label: "SPEED DATE" },
  { key: "chikology", label: "CHIKOLOGY" },
  { key: "match_reveal", label: "MATCH" },
];

const STAGE_TITLES = {
  check_in: "Check-in",
  opening: "Opening",
  mingle: "Mingle Game • Human Bingo",
  speed_dating: "Speed Dating",
  chikology: "Chikology",
  match_reveal: "Match Reveal",
};

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

  const currentStageIndex = STAGES.findIndex((s) => s.key === event?.status);

  const nextAction = () => {
    switch (event?.status) {
      case "check_in":
        return { href: "/pass", label: "BUKA EVENT PASS" };
      case "mingle":
        return { href: "/mingle", label: "OPEN CURRENT SESSION" };
      case "speed_dating":
        return { href: "/speed-date", label: "OPEN CURRENT SESSION" };
      case "chikology":
        return { href: "/chikology", label: "OPEN CURRENT SESSION" };
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
        {registration.status !== "approved" ? (
          <>
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
            <div className="card">
              <p style={{ margin: 0 }}>
                Status aplikasimu sedang <strong>{registration.status}</strong>. Kami akan
                mengabari begitu curation selesai.
              </p>
              <Link href="/application-status">
                <button className="btn btn-secondary" style={{ marginTop: 10 }}>
                  LIHAT DETAIL STATUS
                </button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="card" style={{ background: "var(--forest)", color: "#fff" }}>
              <strong>WELCOME TO THE CIRCLE.</strong>
              <p style={{ margin: "6px 0 0", opacity: 0.9 }}>
                Kamu udah checked-in. Ikutin tahap sekarang dan tetap present.
              </p>
            </div>

            <div style={{ display: "flex", gap: 5, margin: "18px 0 4px" }}>
              {STAGES.map((s, idx) => (
                <div key={s.key} style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 4,
                      background: idx <= currentStageIndex ? "var(--terracotta)" : "var(--border)",
                    }}
                  />
                  <p className="muted" style={{ fontSize: 10, margin: "4px 0 0", textAlign: "center" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <p className="muted" style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>CURRENT STAGE</p>
              <strong style={{ fontSize: 18 }}>{STAGE_TITLES[event?.status] || event?.status}</strong>
            </div>

            <Link href={action.href}>
              <button className="btn btn-primary">{action.label}</button>
            </Link>

            <div className="card">
              <p className="muted" style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>EVENT INFO</p>
              <p style={{ margin: "4px 0 0" }}>
                {event && new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "full" })} • {event?.name}
              </p>
            </div>
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}
