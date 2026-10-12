import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const mono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "The Machine | experiments.dating",
  description:
    "A two-player web experience where one person acts as a human recommendation algorithm for another. The Truman Show meets recommendation science.",
  openGraph: {
    title: "The Machine | experiments.dating",
    description:
      "Can a stranger learn your taste in 15 minutes just by watching you scroll?",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} antialiased`}>
        {children}
        <div className="crt-overlay" />
      </body>
    </html>
  );
}
