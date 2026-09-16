"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabaseClient";

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const eventId = params.get("event") || "";
  const supabase = createClient();
  const [form, setForm] = useState({
    fullName: "",
    nickname: "",
    email: "",
    password: "",
    phone: "",
    dob: "",
    gender: "",
    city: "",
    referralCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const age = form.dob
      ? Math.floor((Date.now() - new Date(form.dob).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          phone: form.phone,
          full_name: form.fullName,
          nickname: form.nickname,
          age,
          gender: form.gender,
          city: form.city,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Row di tabel profiles dibuat otomatis oleh trigger database (on_auth_user_created).

    if (!authData.session) {
      setLoading(false);
      setError(
        "Akun berhasil dibuat. Cek email kamu dan klik link konfirmasi sebelum login untuk lanjut buat profile."
      );
      return;
    }

    // Redeem referral code (kalau ada).
    if (form.referralCode.trim()) {
      const code = form.referralCode.trim().toUpperCase();
      const { data: referrer } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("user_id", `${code}%`)
        .maybeSingle();
      if (referrer && referrer.user_id !== authData.user.id) {
        await supabase.from("referrals").insert({
          referrer_id: referrer.user_id,
          referred_user_id: authData.user.id,
          event_id: eventId || null,
        });
      }
    }

    setLoading(false);
    const qs = eventId ? `?event=${eventId}` : "";
    router.push(`/profile/build${qs}`);
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: 30 }}>Create Account</h1>
        <p className="muted">Registrasi singkat — detail dating cuma dipakai buat curation & pairing.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Nama lengkap</label>
            <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div className="field">
            <label>Nickname (dipakai saat event)</label>
            <input required value={form.nickname} onChange={(e) => update("nickname", e.target.value)} />
          </div>
          <div className="field">
            <label>Email (privat)</label>
            <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Nomor HP (privat)</label>
            <input required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="field">
            <label>Tanggal lahir</label>
            <input required type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} />
          </div>
          <div className="field">
            <label>Gender</label>
            <select required value={form.gender} onChange={(e) => update("gender", e.target.value)}>
              <option value="">Pilih</option>
              <option value="female">Perempuan</option>
              <option value="male">Laki-laki</option>
            </select>
          </div>
          <div className="field">
            <label>Kota domisili</label>
            <input required value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="field">
            <label>Kode referral (opsional)</label>
            <input
              value={form.referralCode}
              onChange={(e) => update("referralCode", e.target.value)}
              placeholder="mis. AB12CD34"
            />
          </div>

          <div className="card" style={{ background: "#f4d9d4", border: "none" }}>
            <strong style={{ color: "var(--terracotta)" }}>PRIVACY</strong>
            <p style={{ margin: "4px 0 0" }}>Kontak kamu (email & nomor HP) tidak pernah ditampilkan ke peserta lain.</p>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "Memproses..." : "LANJUT BUAT PROFILE"}
          </button>
        </form>

        <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
          Sudah punya akun? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container">Memuat...</div>}>
      <RegisterInner />
    </Suspense>
  );
}
