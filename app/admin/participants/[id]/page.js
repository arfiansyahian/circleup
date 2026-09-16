"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import { createClient } from "@/lib/supabaseClient";

function genCode() {
  return "RD-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default function ParticipantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [registration, setRegistration] = useState(null);
  const [profile, setProfile] = useState(null);
  const [interests, setInterests] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: reg, error: regError } = await supabase
      .from("registrations")
      .select("*, events(name)")
      .eq("id", id)
      .single();
    if (regError) {
      setError(regError.message);
      return;
    }
    setRegistration(reg);
    setNotes(reg.curation_notes || "");

    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", reg.user_id).single();
    setProfile(p);

    const { data: rows } = await supabase
      .from("user_interests")
      .select("interests(name)")
      .eq("user_id", reg.user_id);
    setInterests((rows || []).map((r) => r.interests?.name).filter(Boolean));
  }

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function setStatus(status) {
    setSaving(true);
    setError("");
    const patch = { status, curation_notes: notes };
    if (status === "approved") patch.participant_code = genCode();

    const { error: updateError } = await supabase.from("registrations").update(patch).eq("id", id);
    if (updateError) {
      setError(`Gagal update status: ${updateError.message}`);
      setSaving(false);
      return;
    }

    await supabase
      .from("audit_log")
      .insert({ action: "registration_status_change", target_table: "registrations", target_id: id, metadata: { status } });

    setSaving(false);
    load();
  }

  async function saveNotesOnly() {
    setSaving(true);
    const { error: updateError } = await supabase.from("registrations").update({ curation_notes: notes }).eq("id", id);
    setSaving(false);
    if (updateError) setError(updateError.message);
  }

  if (!registration || !profile) {
    return (
      <div>
        <p className="muted">Memuat profil...</p>
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/participants" className="muted" style={{ textDecoration: "underline" }}>
        ← Kembali ke daftar
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>{profile.nickname}</h1>
        <StatusPill status={registration.status} />
      </div>
      <p className="muted">{registration.events?.name}</p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 20 }}>
        <div style={{ flex: "0 0 220px" }}>
          <div
            style={{
              width: "100%",
              height: 220,
              borderRadius: 16,
              background: profile.photo_url ? `url(${profile.photo_url}) center/cover` : "#eadfca",
            }}
          />
        </div>

        <div style={{ flex: "1 1 320px" }}>
          <table className="admin-table">
            <tbody>
              <tr><td><strong>Nama lengkap</strong></td><td>{profile.full_name}</td></tr>
              <tr><td><strong>Umur</strong></td><td>{profile.age}</td></tr>
              <tr><td><strong>Gender</strong></td><td>{profile.gender}</td></tr>
              <tr><td><strong>Kota</strong></td><td>{profile.city}</td></tr>
              <tr><td><strong>Pekerjaan</strong></td><td>{profile.occupation}</td></tr>
              <tr><td><strong>Dating intent</strong></td><td>{profile.dating_intent}</td></tr>
              <tr><td><strong>Ask me about</strong></td><td>{profile.ask_me_about || "—"}</td></tr>
              <tr><td><strong>Currently into</strong></td><td>{profile.currently_into || "—"}</td></tr>
              <tr>
                <td><strong>Interests</strong></td>
                <td>{interests.length ? interests.join(", ") : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20, maxWidth: 500 }}>
        <label style={{ fontWeight: 700, color: "var(--forest)", fontSize: 13 }}>Catatan curation (internal, admin only)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: "1.5px solid var(--border)" }}
        />
        <button className="btn btn-secondary" style={{ marginTop: 8, width: "auto" }} disabled={saving} onClick={saveNotesOnly}>
          Simpan catatan
        </button>
      </div>

      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary" style={{ width: "auto" }} disabled={saving} onClick={() => setStatus("approved")}>
          APPROVE
        </button>
        <button className="btn btn-secondary" style={{ width: "auto" }} disabled={saving} onClick={() => setStatus("waitlist")}>
          WAITLIST
        </button>
        <button className="btn btn-danger" style={{ width: "auto" }} disabled={saving} onClick={() => setStatus("rejected")}>
          REJECT
        </button>
      </div>
    </div>
  );
}
