import "./globals.css";

export const metadata = {
  title: "CircleUp — Let's Create a Reason to Talk",
  description: "CircleUp Re:Date — curated offline dating experience platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
