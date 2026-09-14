import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabaseServer";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, slug, date, location")
    .neq("status", "draft")
    .order("date", { ascending: true })
    .limit(3);

  return (
    <div>
      <Navbar />
      <div className="container">
        <div style={{ marginTop: 24 }}>
          <p className="pill pill-active" style={{ marginBottom: 16 }}>
            Re:Date Experience
          </p>
          <h1>CIRCLE UP.</h1>
          <p style={{ fontSize: 17 }}>
            Circle-mu makin kecil. Ketemu orang baru bukan berarti connect. Dating app terasa
            cepat dan dangkal. CircleUp mengembalikan momen: obrolan nyata, tatap muka, dengan
            konteks yang jelas.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            <Link href="/register">
              <button className="btn btn-primary">JOIN THE CIRCLE</button>
            </Link>
            <Link href="#how-it-works">
              <button className="btn btn-secondary">HOW IT WORKS</button>
            </Link>
          </div>
        </div>

        <div id="how-it-works" style={{ marginTop: 48 }}>
          <h2>Empat momen inti</h2>
          <div className="card">
            <strong>Opening</strong>
            <p className="muted" style={{ margin: 0 }}>
              Pengantar hangat sebelum semua orang mulai berbaur.
            </p>
          </div>
          <div className="card">
            <strong>Mingle Game</strong>
            <p className="muted" style={{ margin: 0 }}>
              Structured play (Human Bingo) — cara ringan untuk memulai obrolan.
            </p>
          </div>
          <div className="card">
            <strong>Speed Dating</strong>
            <p className="muted" style={{ margin: 0 }}>
              Rotasi percakapan 1:1, bertimer, dengan konteks profil singkat.
            </p>
          </div>
          <div className="card">
            <strong>Chikology</strong>
            <p className="muted" style={{ margin: 0 }}>
              Sesi refleksi bersama psikolog sebelum Match Reveal.
            </p>
          </div>
        </div>

        {events && events.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2>Event mendatang</h2>
            {events.map((e) => (
              <Link key={e.id} href={`/events/${e.slug}`}>
                <div className="card">
                  <strong>{e.name}</strong>
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
        )}
      </div>
    </div>
  );
}
