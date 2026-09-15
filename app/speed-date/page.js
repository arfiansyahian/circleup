"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/ProfileCard";
import RoundTimer from "@/components/RoundTimer";
import { createClient } from "@/lib/supabaseClient";

export default function SpeedDatePage() {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [round, setRound] = useState(null);
  const [partner, setPartner] = useState(null);
  const [interests, setInterests] = useState([]);
  const [readyRoundId, setReadyRoundId] = useState(null); // round.id yang sudah di-acknowledge peserta

  async function loadRoundAndPartner(uid, evId) {
    const { data: r } = await supabase
      .from("rounds")
      .select("*")
      .eq("event_id", evId)
      .in("status", ["ready", "active", "time_up", "voting"])
      .order("round_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!r) {
      setRound(null);
      return;
    }
    setRound(r);

    const { data: pairing } = await supabase
      .from("pairings")
      .select("*")
      .eq("round_id", r.id)
      .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
      .maybeSingle();

    if (!pairing) {
      setPartner(null);
      return;
    }

    const partnerId = pairing.participant_a === uid ? pairing.participant_b : pairing.participant_a;
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", partnerId).single();
    setPartner(p);

    const { data: rows } = await supabase
      .from("user_interests")
      .select("interests(name)")
      .eq("user_id", partnerId);
    setInterests((rows || []).map((row) => row.interests?.name).filter(Boolean));

    if (r.status === "time_up" || r.status === "voting") {
      router.push(`/vote?round=${r.id}&partner=${partnerId}`);
    }
  }

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: reg } = await supabase
        .from("registrations")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();
      if (!reg) return;
      setEventId(reg.event_id);
      await loadRoundAndPartner(user.id, reg.event_id);
    })();
  }, []);

  useEffect(() => {
    if (!eventId || !userId) return;

    const channel = supabase
      .channel(`speed-date-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rounds", filter: `event_id=eq.${eventId}` },
        () => loadRoundAndPartner(userId, eventId)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [eventId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: 80 }}>
        <h2>Menunggu round berikutnya…</h2>
        <p className="muted">Admin akan memulai round segera. Tetap di halaman ini.</p>
      </div>
    );
  }

  const hasAcknowledged = readyRoundId === round.id;

  return (
    <div className="container">
      <p className="pill pill-active" style={{ marginBottom: 12 }}>
        Round {round.round_number}
      </p>

      <ProfileCard profile={partner} interests={interests} prompt={round.prompt} />

      {round.status === "ready" && !hasAcknowledged && (
        <>
          <p className="muted" style={{ marginBottom: 8 }}>
            Ini partner kamu untuk round ini. Siap-siap ngobrol!
          </p>
          <button className="btn btn-primary" onClick={() => setReadyRoundId(round.id)}>
            I'M READY
          </button>
        </>
      )}

      {round.status === "ready" && hasAcknowledged && (
        <>
          <p className="muted" style={{ marginBottom: 8 }}>Menunggu admin memulai timer…</p>
          <div className="timer-circle" style={{ opacity: 0.6 }}>
            {String(Math.floor(round.duration_seconds / 60)).padStart(2, "0")}:00
          </div>
        </>
      )}

      {round.status === "active" && round.server_start_at && (
        <RoundTimer
          serverStartAt={round.server_start_at}
          durationSeconds={round.duration_seconds}
          onTimeUp={() => partner && router.push(`/vote?round=${round.id}&partner=${partner.user_id}`)}
        />
      )}
    </div>
  );
}
