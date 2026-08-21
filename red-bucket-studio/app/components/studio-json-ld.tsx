import { siteUrl, studio } from "../lib/site";

/**
 * Structured data for the studio.
 *
 * A one-person fabrication shop competing for "custom sign / custom furniture
 * near me" searches gets more out of a correct LocalBusiness record than out of
 * almost any copy change, and search engines will not infer it from prose.
 */
export function StudioJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#studio`,
    name: studio.name,
    url: siteUrl,
    email: studio.email,
    image: `${siteUrl}/og.jpg`,
    logo: `${siteUrl}/assets/red-bucket-brand.png`,
    description:
      "Custom fabrication studio turning vintage objects, raw materials and salvage into one-of-one furniture, lighting, signs, gifts and commercial fixtures.",
    address: {
      "@type": "PostalAddress",
      addressLocality: studio.city,
      addressRegion: studio.region,
      addressCountry: studio.country,
    },
    areaServed: [
      { "@type": "State", name: studio.regionName },
      { "@type": "Country", name: "United States" },
    ],
    knowsAbout: [
      "Custom furniture fabrication",
      "CNC routing and engraving",
      "Upcycled and salvaged materials",
      "Commercial signage and retail displays",
      "Personalized gifts",
    ],
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Custom commissions" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Commercial design and fabrication" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Found-object transformation" } },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Values are authored in this file, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
