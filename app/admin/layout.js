"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const NAV_ADMIN = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/pairing", label: "Pairing" },
  { href: "/admin/round-control", label: "Round Control" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/analytics", label: "Analytics" },
];

// Crew: operasional hari-H saja — tidak bisa approve/waitlist, generate/lock pairing, atau reveal match.
const NAV_CREW = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/participants", label: "Check-in" },
  { href: "/admin/round-control", label: "Round Control" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [role, setRole] = useState(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
      setRole(profile?.role || "crew");
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nav = role === "admin" ? NAV_ADMIN : NAV_CREW;

  return (
    <div className="admin-shell">
      <div className="admin-sidebar">
        <div className="logo" style={{ color: "#fff", marginBottom: 4 }}>
          CIRCLE UP
        </div>
        <p style={{ color: "#9fb3a9", fontSize: 12, marginBottom: 20, textTransform: "uppercase" }}>
          {role || "..."}
        </p>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "active" : ""}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="admin-content">{children}</div>
    </div>
  );
}
