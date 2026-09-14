"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
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

    // Row di tabel profiles dibuat otomatis oleh trigger database (on_auth_user_created)
    // begitu akun auth dibuat — jadi aman walau sesi belum aktif (mis. email belum dikonfirmasi).

    if (!authData.session) {
      // Project ini mewajibkan konfirmasi email sebelum bisa login.
      setLoading(false);
      setError(
        "Akun berhasil dibuat. Cek email kamu dan klik link konfirmasi sebelum login untuk lanjut buat profile."
      );
      return;
    }

    setLoading(false);
    router.push("/profile/build");
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: 30 }}>Create Account</h1>
        <p className="muted">
          Email dan nomor telepon bersifat privat — tidak akan pernah ditampilkan ke peserta lain.
        </p>

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
