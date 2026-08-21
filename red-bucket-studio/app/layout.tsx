import type { Metadata, Viewport } from "next";
import { siteUrl } from "./lib/site";
import "./globals.css";

const title = "Red Bucket Design Co | Found. Rebuilt. Unmistakably Yours.";
const description =
  "Vintage objects, raw materials and strange ideas turned into one-of-one furniture, lighting, signs, gifts and functional art. Custom fabrication in Bridgewater, New Jersey.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Red Bucket Design Co" },
  description,
  applicationName: "Red Bucket Design Co",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Red Bucket Design Co",
    locale: "en_US",
    url: "/",
    title,
    description:
      "Custom objects, furniture, lighting and gifts made from vintage finds, raw materials and big ideas.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Red Bucket Design Co custom fabrication" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "Custom objects, furniture, lighting and gifts made one at a time.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#10110f",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
