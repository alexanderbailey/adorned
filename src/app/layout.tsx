import type { Metadata, Viewport } from "next";
import "./globals.css";
// Inter loaded via globals.css @import

export const metadata: Metadata = {
  title: "Adorned",
  description: "Your personal wardrobe and outfit stylist",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Adorned",
  },
  icons: {
    apple: [
      { url: "/icons/icon.svg", sizes: "any" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1F1F1D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-charcoal font-sans antialiased">{children}</body>
    </html>
  );
}
