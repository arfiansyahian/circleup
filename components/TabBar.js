"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Home" },
  { href: "/pass", label: "Event" },
  { href: "/profile/preview", label: "Profile" },
  { href: "/matches", label: "Match" },
  { href: "/feedback", label: "Feedback" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <div className="tabbar">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className={pathname === tab.href ? "active" : ""}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
