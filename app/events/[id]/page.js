"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";

const MOMENTS = [
  { title: "Opening", desc: "Pengantar dan pemanasan sebelum sesi dimulai." },
  { title: "Mingle Game", desc: "Human Bingo — cairkan suasana sebelum speed dating." },
  { title: "Speed Dating", desc: null },
  { title: "Chikology", desc: "Sesi refleksi bersama Chikology sebelum Match Reveal." },
];

export default function EventDetailPage({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [session, setSession] = useState(undefined); // undefined = belum dicek

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("slug", params.id).single();
      if (!data) {
        setNotFoundFlag(true);
        return;
      }
      setEvent(data);

      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
    })();
  }, [params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleJoin() {
    if (!event) return;

    if (!session) {
      router.push(`/register?event=${event.id}`);
      return;
    }

    // Sudah login — jangan minta login/register lagi. Cek apakah profile udah lengkap.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("user_id", session.user.id)
      .single();

    if (!profile?.onboarded) {
      router.push(`/profile/build?event=${event.id}`);
    } else {
      router.push(`/profile/preview?event=${event.id}`);
    }
  }

  if (notFoundFlag) return notFound();
  if (!event) {
    return (
      <div>
        <Navbar />
        <div className="public-container">
          <p className="muted" style={{ marginTop: 24 }}>Memuat...</p>
        </div>
      </div>
    );
  }

  const slotsLeft = Math.max(event.capacity - event.approved_count, 0);
  const percentFull = event.capacity > 0 ? Math.min((event.approved_count / event.capacity) * 100, 100) : 0;
  const almostFull = slotsLeft <= Math.max(Math.round(event.capacity * 0.2), 2);
  const priceLabel = event.price_rupiah > 0 ? `Rp${event.price_rupiah.toLocaleString("id-ID")}` : "Gratis";

  const PriceCard = (
    <div className="price-card">
      <p className="muted" style={{ margin: 0 }}>Harga tiket</p>
      <h2 style={{ margin: "4px 0 14px" }}>{priceLabel}</h2>

      <div className="slot-urgency">
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: almostFull ? "var(--terracotta)" : "var(--forest)" }}>
          {slotsLeft > 0 ? `Sisa ${slotsLeft} slot` : "Slot penuh — masuk waitlist"}
        </p>
        <div className="slot-track">
          <div className="slot-fill" style={{ width: `${percentFull}%` }} />
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleJoin}>
        JOIN RE:DATE
      </button>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="public-container">
        <div className="public-hero">
          {event.cover_image_url && <img src={event.cover_image_url} alt={event.name} />}
          <div className="public-hero-overlay">
            <span className="pill pill-active" style={{ marginBottom: 10, display: "inline-block" }}>
              {event.status.replaceAll("_", " ")}
            </span>
            <h1>{event.name}</h1>
            <p>
              {new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "full" })} • {event.location}
            </p>
          </div>
        </div>

        <div className="public-two-col">
          <div>
            <p style={{ fontSize: 17 }}>{event.description}</p>

            <div className="gold-divider" />

            <h2 style={{ fontSize: 22, marginBottom: 14 }}>Alur acara</h2>
            <div className="moment-grid">
              {MOMENTS.map((m, idx) => (
                <div className="moment-card" key={m.title}>
                  <div className="moment-number">{idx + 1}</div>
                  <strong>{m.title}</strong>
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    {m.title === "Speed Dating"
                      ? `${event.number_of_rounds} round, masing-masing ${event.round_duration_minutes} menit.`
                      : m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="public-sticky-col">{PriceCard}</div>
        </div>
      </div>

      <div className="sticky-cta-bar">
        <div>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>{priceLabel}</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
            {slotsLeft > 0 ? `Sisa ${slotsLeft} slot` : "Waitlist"}
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: "auto", padding: "12px 22px" }} onClick={handleJoin}>
          JOIN RE:DATE
        </button>
      </div>
    </div>
  );
}
