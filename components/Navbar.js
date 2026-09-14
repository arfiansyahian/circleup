import Link from "next/link";

export default function Navbar() {
  return (
    <div className="navbar">
      <Link href="/" className="logo">
        CIRCLE UP
      </Link>
      <Link href="/login" className="muted">
        Login
      </Link>
    </div>
  );
}
