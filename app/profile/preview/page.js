"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import { createClient } from "@/lib/supabaseClient";

function ProfilePreviewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [interests, setInterests] = useState([]);
  const [openEvents, setOpenEvents] = useState([]);
  const [eventId, setEventId] = useState(params.get("event") || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile(p);

      const { data: rows } = await supabase
        .from("user_interests")
        .select("interests(name)")
        .eq("user_id", user.id);
      setInterests((rows || []).map((r) => r.interests?.name).filter(Boolean));

      // Kalau belum ada event dipilih (mis. user masuk langsung ke halaman ini),
      // tawarkan event yang lagi buka pendaftaran.
      if (!params.get("event")) {
        const { data: events } = await supabase
          .from("events")
          .select("id, name, date")
          .eq("status", "open_registration")
          .order("date", { ascending: true });
        setOpenEvents(events || []);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitForCuration() {
    if (!eventId) {
      setError("Pilih event dulu sebelum submit.");
      return;
    }
    setSubmitting(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: regError } = await supabase.from("registrations").insert({
      user_id: user.id,
      event_id: eventId,
      status: "pending",
    });

    if (regError) {
      setSubmitting(false);
      if (regError.code === "23505") {
        // sudah pernah daftar ke event ini — bukan error fatal, tetap lanjut.
        setSubmitted(true);
        return;
      }
      setError(regError.message);
      return;
    }

    // Lengkapi event_id pada referral row (kalau user tadi masuk pakai kode referral sebelum pilih event).
    await supabase
      .from("referrals")
      .update({ event_id: eventId })
      .eq("referred_user_id", user.id)
      .is("event_id", null);

    setSubmitting(false);
    setSubmitted(true);
  }

  if (!profile) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <p className="muted">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: 30 }}>Profile Preview</h1>
        <p className="muted">Begini profilmu akan terlihat oleh partner saat speed dating.</p>

        <ProfileCard profile={profile} interests={interests} prompt={profile.ask_me_about} />

        <div className="card" style={{ background: "#f5efe5" }}>
          <strong>Tidak ditampilkan ke peserta lain:</strong>
          <ul className="muted" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li>Email & nomor HP</li>
            <li>Dating intent</li>
            <li>Riwayat & pilihan voting</li>
          </ul>
        </div>

        {submitted ? (
          <div className="card">
            <p style={{ margin: 0, fontWeight: 600 }}>
              Pendaftaran terkirim — statusmu sekarang "Under Review".
            </p>
            <Link href="/application-status">
              <button className="btn btn-primary" style={{ marginTop: 10 }}>
                LIHAT STATUS APLIKASI
              </button>
            </Link>
          </div>
        ) : (
          <>
            {openEvents.length > 0 && !params.get("event") && (
              <div className="field">
                <label>Pilih event</label>
                <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                  <option value="">Pilih event yang mau diikuti</option>
                  {openEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} — {new Date(ev.date).toLocaleDateString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/profile/build" style={{ flex: 1 }}>
                <button className="btn btn-secondary">EDIT PROFILE</button>
              </Link>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={submitting}
                onClick={submitForCuration}
              >
                {submitting ? "Mengirim..." : "SUBMIT FOR CURATION"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePreviewPage() {
  return (
    <Suspense fallback={<div className="container">Memuat...</div>}>
      <ProfilePreviewInner />
    </Suspense>
  );
}
