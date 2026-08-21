import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { ShareButton } from "../components/share-button";
import { featuredWork } from "../lib/catalog";

export const metadata: Metadata = { title: "Custom Builds | Red Bucket Design Co", description: "Explore custom signs, gifts, furniture and one-of-one objects made by Red Bucket Design Co." };

export default function WorkPage() {
  return <main id="main"><SiteHeader />
    <section className="work-hero page-shell"><p className="eyebrow">Custom Builds</p><h1>Made for one person.<br /><em>Remembered by everyone.</em></h1><p>Every piece starts somewhere: an interest, a place, a saved object, a person worth surprising. This is how those stories became real.</p></section>
    <section className="page-shell story-list">
      {featuredWork.map((item, index) => <article className="story-row" key={item.title}>
        <div className="story-index">0{index + 1}</div><div className="story-image"><img src={item.image} alt={item.alt} width={item.width} height={item.height} loading={index === 0 ? "eager" : "lazy"} decoding="async" /></div>
        <div className="story-copy"><p className="eyebrow">{item.kicker}</p><h2>{item.title}</h2><p>{item.story}</p><span>{item.materials}</span><div className="story-actions"><Link href="/gift-finder">Commission something inspired by this →</Link><ShareButton title={item.title} text={`Look what Red Bucket can make: ${item.title}`} path="/work" /></div></div>
      </article>)}
    </section>
    <section className="page-shell salvage-callout"><div><p className="eyebrow light">The Salvage Shelf</p><h2>Some materials are waiting for the right story.</h2><p>Vintage skis, industrial panels, old cases and curious pieces that could become something entirely different.</p></div><Link className="button button-cream" href="/gift-finder">Commission a piece</Link></section>
    <SiteFooter />
  </main>;
}
