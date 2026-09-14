"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/pairing", label: "Pairing" },
  { href: "/admin/round-control", label: "Round Control" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  return (
    <div className="admin-shell">
      <div className="admin-sidebar">
        <div className="logo" style={{ color: "#fff", marginBottom: 24 }}>
          CIRCLE UP
        </div>
        {NAV.map((item) => (
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
