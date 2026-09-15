"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function ChikologyPage() {
  const supabase = createClient();
  const router = useRouter();
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [eventId, setEventId] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reg } = await supabase
        .from("registrations")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      if (!reg) return;
      setEventId(reg.event_id);

      const { data: existing } = await supabase
        .from("chikology_reflections")
        .select("reflection")
        .eq("event_id", reg.event_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        setReflection(existing.reflection || "");
        setSaved(true);
      }
    })();
  }, []);

  async function saveReflection() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("chikology_reflections").upsert(
      { event_id: eventId, user_id: user.id, reflection },
      { onConflict: "event_id,user_id" }
    );
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 28 }}>Chikology</h1>
      <p className="muted">
        Sebelum match reveal, luangkan waktu sebentar. Gimana rasanya ngobrol tadi? Apa yang
        paling nempel di ingatan?
      </p>

      <div className="field">
        <label>Refleksi kamu (opsional, cuma buat diri sendiri)</label>
        <textarea
          rows={6}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Tulis apa aja yang kamu rasain..."
        />
      </div>

      <button className="btn btn-primary" disabled={saving} onClick={saveReflection}>
        {saving ? "Menyimpan..." : "SAVE REFLECTION"}
      </button>

      {saved && (
        <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => router.push("/dashboard")}>
          KEMBALI KE DASHBOARD
        </button>
      )}
    </div>
  );
}
