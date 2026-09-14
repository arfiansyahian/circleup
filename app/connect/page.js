"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

function ConnectInner() {
  const supabase = createClient();
  const params = useSearchParams();
  const matchId = params.get("match");
  const [done, setDone] = useState(null);

  async function share(channel) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("connect_consents").insert({
      match_id: matchId,
      user_id: user.id,
      channel,
    });
    setDone(channel);
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 26 }}>Connect</h1>
      <p className="muted">
        Pilih apa yang ingin kamu bagikan. Kontak baru terbuka setelah kedua pihak setuju
        (consent-based).
      </p>

      <div className="card">
        <strong>Yang akan dibagikan</strong>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          Username sesuai channel yang kamu pilih di bawah — tidak ada info lain yang terbuka
          otomatis.
        </p>
      </div>

      <button className="btn btn-secondary" style={{ marginBottom: 10 }} onClick={() => share("instagram")}>
        Share Instagram
      </button>
      <button className="btn btn-secondary" style={{ marginBottom: 10 }} onClick={() => share("whatsapp")}>
        Share WhatsApp
      </button>
      <button className="btn btn-ghost">Maybe Later</button>

      {done && <p className="muted" style={{ marginTop: 12 }}>Tersimpan. Menunggu partner konfirmasi juga.</p>}
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
