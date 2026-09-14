"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import { createClient } from "@/lib/supabaseClient";

export default function ProfilePreviewPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [interests, setInterests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    })();
  }, []);

  async function submitForCuration() {
    setSubmitting(true);
    // Menandai profile sebagai lengkap; registrasi ke event dilakukan di halaman event detail.
    setSubmitted(true);
    setSubmitting(false);
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
            <p style={{ margin: 0, fontWeight: 600 }}>Profile tersimpan. Sekarang cari event untuk diikuti.</p>
            <Link href="/">
              <button className="btn btn-primary" style={{ marginTop: 10 }}>
                LIHAT EVENT
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/profile/build" style={{ flex: 1 }}>
              <button className="btn btn-secondary">EDIT PROFILE</button>
            </Link>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={submitting} onClick={submitForCuration}>
              SUBMIT FOR CURATION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
