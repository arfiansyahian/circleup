import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

export default async function EventDetailPage({ params }) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", params.id)
    .single();

  if (!event) return notFound();

  return (
    <div>
      <Navbar />
      <div className="container">
        <p className="pill pill-active">{event.status.replaceAll("_", " ")}</p>
        <h1>{event.name}</h1>
        <p className="muted">
          {new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "full" })} •{" "}
          {event.location} • ±{Math.round(event.duration_minutes / 60)} jam
        </p>
        <p>{event.description}</p>

        <div className="card">
          <strong>Opening</strong>
          <p className="muted" style={{ margin: 0 }}>
            Pengantar dan pemanasan sebelum sesi dimulai.
          </p>
        </div>
        <div className="card">
          <strong>Mingle Game</strong>
          <p className="muted" style={{ margin: 0 }}>
            Human Bingo — cairkan suasana sebelum speed dating.
          </p>
        </div>
        <div className="card">
          <strong>Speed Dating</strong>
          <p className="muted" style={{ margin: 0 }}>
            {event.number_of_rounds} round, masing-masing {event.round_duration_minutes} menit.
          </p>
        </div>
        <div className="card">
          <strong>Chikology</strong>
          <p className="muted" style={{ margin: 0 }}>
            Sesi refleksi bersama Chikology sebelum Match Reveal.
          </p>
        </div>

        <Link href={`/register?event=${event.id}`}>
          <button className="btn btn-primary" style={{ marginTop: 12 }}>
            JOIN RE:DATE
          </button>
        </Link>
      </div>
    </div>
  );
}
