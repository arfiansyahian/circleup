"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function ConnectInner() {
  const supabase = createClient();
  const params = useSearchParams();
  const matchId = params.get("match");
  const [handle, setHandle] = useState({ instagram: "", whatsapp: "" });
  const [sharing, setSharing] = useState(null);
  const [sharedChannels, setSharedChannels] = useState([]);
  const [revealed, setRevealed] = useState([]);

  async function checkRevealed() {
    const { data } = await supabase.rpc("reveal_contact", { p_match_id: matchId });
    setRevealed((data || []).filter((r) => r.handle));
  }

  useEffect(() => {
    if (matchId) checkRevealed();
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function share(channel) {
    if (!handle[channel].trim()) {
      setSharing(channel);
      return;
    }
    setSharing(channel);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("contact_details").upsert(
      {
        user_id: user.id,
        [channel === "instagram" ? "instagram_handle" : "whatsapp_number"]: handle[channel].trim(),
      },
      { onConflict: "user_id" }
    );

    await supabase.from("connect_consents").upsert(
      { match_id: matchId, user_id: user.id, channel },
      { onConflict: "match_id,user_id,channel" }
    );

    setSharedChannels((prev) => [...prev, channel]);
    setSharing(null);
    checkRevealed();
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 26 }}>Connect</h1>
      <p className="muted">
        Pilih channel & isi handle kamu. Kontak baru kebuka kalau partner kamu juga share channel
        yang sama (consent-based, dua arah).
      </p>

      {revealed.length > 0 && (
        <div className="card" style={{ background: "var(--forest)", color: "#fff" }}>
          <strong>Kontak partner kamu:</strong>
          {revealed.map((r) => (
            <p key={r.channel} style={{ margin: "6px 0 0" }}>
              {r.channel === "instagram" ? "Instagram" : "WhatsApp"}: <strong>{r.handle}</strong>
            </p>
          ))}
        </div>
      )}

      {["instagram", "whatsapp"].map((channel) => (
        <div className="card" key={channel}>
          <strong>{channel === "instagram" ? "Instagram" : "WhatsApp"}</strong>
          {sharedChannels.includes(channel) ? (
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Sudah dibagikan. Menunggu partner share juga.
            </p>
          ) : sharing === channel ? (
            <div style={{ marginTop: 8 }}>
              <input
                placeholder={channel === "instagram" ? "@username" : "08xxxxxxxxxx"}
                value={handle[channel]}
                onChange={(e) => setHandle({ ...handle, [channel]: e.target.value })}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  marginBottom: 8,
                }}
              />
              <button className="btn btn-primary" onClick={() => share(channel)}>
                KONFIRMASI SHARE {channel === "instagram" ? "INSTAGRAM" : "WHATSAPP"}
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => setSharing(channel)}>
              Share {channel === "instagram" ? "Instagram" : "WhatsApp"}
            </button>
          )}
        </div>
      ))}

      <button className="btn btn-ghost">Maybe Later</button>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<div className="container">Memuat...</div>}>
      <ConnectInner />
    </Suspense>
  );
}
