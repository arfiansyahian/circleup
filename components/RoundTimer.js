"use client";

import { useEffect, useState } from "react";

// Countdown dihitung dari server_start_at + duration_seconds (server-authoritative),
// bukan dari local timer, agar tetap benar setelah reconnect (bab 18).
export default function RoundTimer({ serverStartAt, durationSeconds, onTimeUp }) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (!serverStartAt) {
      setRemaining(durationSeconds);
      return;
    }

    const startMs = new Date(serverStartAt).getTime();

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const left = Math.max(durationSeconds - elapsed, 0);
      setRemaining(left);
      if (left === 0 && onTimeUp) onTimeUp();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [serverStartAt, durationSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="timer-circle" aria-live="polite" aria-label={`Sisa waktu ${mm} menit ${ss} detik`}>
      {mm}:{ss}
    </div>
  );
}
