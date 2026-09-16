import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabaseServer";

const MOMENTS = [
  { title: "Opening", desc: "Pengantar hangat sebelum semua orang mulai berbaur." },
  { title: "Mingle Game", desc: "Structured play (Human Bingo) — cara ringan untuk memulai obrolan." },
  { title: "Speed Dating", desc: "Rotasi percakapan 1:1, bertimer, dengan konteks profil singkat." },
  { title: "Chikology", desc: "Sesi refleksi bersama psikolog sebelum Match Reveal." },
];

export default async function LandingPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, slug, date, location, price_rupiah, cover_image_url")
    .neq("status", "draft")
    .order("date", { ascending: true })
    .limit(3);

  return (
    <div>
      <Navbar />
      <div className="public-container">
        <div className="public-hero" style={{ minHeight: 300 }}>
          <div className="public-hero-overlay" style={{ background: "transparent" }}>
            <span className="pill pill-active" style={{ marginBottom: 14, display: "inline-block" }}>
              Re:Date Experience
            </span>
            <h1 style={{ fontSize: 44 }}>CIRCLE UP.</h1>
            <p style={{ maxWidth: 480 }}>
              Circle-mu makin kecil. Dating app terasa cepat dan dangkal. CircleUp
              mengembalikan momen: obrolan nyata, tatap muka, dengan konteks yang jelas.
            </p>
          </div>
        </div>

        <div className="public-two-col">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/register">
              <button className="btn btn-primary">JOIN THE CIRCLE</button>
            </Link>
            <Link href="#how-it-works">
              <button className="btn btn-secondary">HOW IT WORKS</button>
            </Link>
          </div>

          <div className="price-card public-sticky-col">
            <strong>Kenapa CircleUp?</strong>
            <p className="muted" style={{ marginTop: 8, textAlign: "left" }}>
              ✓ Kurasi peserta, bukan swipe bebas
              <br />✓ Percakapan bertimer, fokus, tanpa distraksi
              <br />✓ Match cuma muncul kalau dua-duanya interested
              <br />✓ Kontak baru terbuka setelah consent
            </p>
          </div>
        </div>

        <div id="how-it-works" style={{ marginTop: 48 }}>
          <h2>Empat momen inti</h2>
          <div className="gold-divider" />
          <div className="moment-grid">
            {MOMENTS.map((m, idx) => (
              <div className="moment-card" key={m.title}>
                <div className="moment-number">{idx + 1}</div>
                <strong>{m.title}</strong>
                <p className="muted" style={{ margin: "4px 0 0" }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {events && events.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2>Event mendatang</h2>
            <div className="gold-divider" />
            <div className="moment-grid">
              {events.map((e) => (
                <Link key={e.id} href={`/events/${e.slug}`}>
                  <div className="card" style={{ marginBottom: 0, height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <strong>{e.name}</strong>
                      <span className="pill pill-active">
                        {e.price_rupiah > 0 ? `Rp${e.price_rupiah.toLocaleString("id-ID")}` : "Gratis"}
                      </span>
                    </div>
                    <p className="muted" style={{ margin: 0 }}>
                      {new Date(e.date).toLocaleDateString("id-ID", {
                        dateStyle: "full",
                      })}{" "}
                      • {e.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
