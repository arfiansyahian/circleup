import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <div className="navbar">
      <Link href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Image src="/logo.png" alt="CircleUp" width={36} height={36} style={{ borderRadius: "50%" }} />
        CIRCLE UP
      </Link>
      <Link href="/login" className="muted">
        Login
      </Link>
    </div>
  );
}
