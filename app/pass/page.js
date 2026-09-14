"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import TabBar from "@/components/TabBar";
import StatusPill from "@/components/StatusPill";
import { createClient } from "@/lib/supabaseClient";

export default function EventPassPage() {
  const supabase = createClient();
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reg } = await supabase
        .from("registrations")
        .select("*, events(name, date, location)")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setRegistration(reg);
    })();
  }, []);

  if (!registration) {
    return (
      <div>
        <div className="container">
          <p className="muted">Event pass akan muncul setelah aplikasi kamu di-approve.</p>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div>
      <div className="container" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 26 }}>Event Pass</h1>
        <div className="card" style={{ background: "var(--forest)", color: "#fff" }}>
          <StatusPill status={registration.checked_in_at ? "completed" : "approved"} />
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 16,
              display: "inline-block",
              margin: "16px 0",
            }}
          >
            <QRCodeSVG value={registration.participant_code || registration.id} size={200} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
            {registration.participant_code}
          </p>
          <p style={{ margin: "10px 0 0", opacity: 0.9 }}>{registration.events?.name}</p>
          <p style={{ margin: 0, opacity: 0.75, fontSize: 13 }}>
            {registration.events &&
              new Date(registration.events.date).toLocaleDateString("id-ID", { dateStyle: "full" })}
          </p>
        </div>
        <p className="muted">Tunjukkan QR ini ke crew saat check-in di venue.</p>
      </div>
      <TabBar />
    </div>
  );
}
