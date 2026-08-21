import Link from "next/link";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { NewsletterForm } from "./components/newsletter-form";
import { featuredProducts, featuredWork } from "./lib/catalog";
import { StudioJsonLd } from "./components/studio-json-ld";

export default function Home() {
  return (
    <main id="main">
      <StudioJsonLd />
      <SiteHeader />

      <section className="hero-shell">
        <div className="hero-media" aria-hidden="true">
          <img
            src="/assets/hero-cnc.webp"
            srcSet="/assets/hero-cnc-768.webp 768w, /assets/hero-cnc-1100.webp 1100w, /assets/hero-cnc.webp 1355w"
            sizes="100vw"
            alt=""
            width={1355}
            height={1250}
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero-shade" />
        </div>
        <div className="page-shell hero-content">
          <div className="hero-copy">
            <p className="eyebrow light">Custom fabrication · Found-object alchemy</p>
            <h1>Found. Rebuilt.<br /><em>Unmistakably yours.</em></h1>
            <p className="hero-lede">
              Vintage objects, raw materials and strange ideas turned into furniture, lighting,
              signs, gifts and functional art that could not come from anywhere else.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/gift-finder">Commission a piece</Link>
              <Link className="button button-ghost" href="/work">Explore custom builds</Link>
            </div>
          </div>
          <aside className="hero-note">
            <span className="status-dot" />
            <div><b>Custom commissions open</b><br /><span>tell Sam what you found</span></div>
          </aside>
        </div>
      </section>

      <section className="page-shell path-section" id="start">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">Start where you are</p>
            <h2>Three ways into the workshop.</h2>
          </div>
          <p>You do not need drawings or perfect words. A photo, a story, or a half-formed idea is enough.</p>
        </div>
        <div className="path-grid">
          <Link className="path-card path-dark" href="/shop">
            <span className="path-number">01</span>
            <div><p>Ready now</p><h3>Pick it. Make it yours. Check out.</h3></div>
            <span className="text-link">Shop the collection <b>↗</b></span>
          </Link>
          <Link className="path-card path-red" href="/gift-finder">
            <span className="path-number">02</span>
            <div><p>The right gift</p><h3>Give Sam the clues. Build the idea together.</h3></div>
            <span className="text-link">Commission a piece <b>↗</b></span>
          </Link>
          <Link className="path-card path-image" href="/second-act">
            <img src="/assets/engraving-detail.webp" alt="Close-up of Red Bucket engraving work" width={1054} height={1400} loading="lazy" decoding="async" />
            <span className="path-number">03</span>
            <div><p>The Second Act</p><h3>Upload the old object. Imagine its next life.</h3></div>
            <span className="text-link">Show Sam what you have <b>↗</b></span>
          </Link>
        </div>
      </section>

      <section className="work-section" id="work">
        <div className="page-shell">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">Custom Builds</p><h2>Not a catalog. A record of what is possible.</h2></div>
            <Link className="quiet-link" href="/work">Explore custom builds <span>→</span></Link>
          </div>
          <div className="work-grid">
            {featuredWork.map((item, index) => (
              <Link href="/work" className={`work-card work-card-${index + 1}`} key={item.title}>
                <img src={item.image} alt={item.alt} width={item.width} height={item.height} loading={index > 1 ? "lazy" : "eager"} decoding="async" />
                <div className="work-overlay">
                  <p>{item.kicker}</p>
                  <h3>{item.title}</h3>
                  <span>{item.materials}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="initiative-section"><div className="page-shell initiative-grid"><article className="airplane-initiative"><img src="/assets/airplane-wing-table.webp" alt="Aircraft wing used as functional furniture" width={537} height={372} loading="lazy" decoding="async" /><div><p className="eyebrow light">In the hangar · Collection 001</p><h2>A real airplane is becoming furniture.</h2><p>Functional tables and decor built from authentic aircraft components. The collection is in development now.</p><Link href="/work">Follow the aircraft build →</Link><small>Image shows the design direction. Current pieces are in production.</small></div></article><article className="commercial-initiative"><img src="/assets/custom-store-display.webp" alt="Custom fabricated commercial display" width={514} height={773} loading="lazy" decoding="async" /><div><p className="eyebrow">Commercial work</p><h2>Open a business with a point of view.</h2><p>Furniture, bars, displays, signs and statement pieces for restaurants, retail and hospitality.</p><Link href="/commercial">Explore commercial fabrication →</Link></div></article></div></section>

      <section className="page-shell shop-section" id="shop">
        <div className="section-heading split-heading">
          <div><p className="eyebrow">The useful, the personal, the unexpected</p><h2>Things you can make yours today.</h2></div>
          <Link className="quiet-link" href="/shop">Shop all pieces <span>→</span></Link>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <Link href={`/shop?product=${product.slug}`} className="product-card" key={product.slug}>
              <div className="product-image">
                <img src={product.image} alt={product.alt} loading="lazy" decoding="async" />
                {product.badge && <span className="product-badge">{product.badge}</span>}
                <span className="quick-add">Customize <b>+</b></span>
              </div>
              <div className="product-info"><div><h3>{product.name}</h3><p>{product.detail}</p></div><strong>From ${product.price}</strong></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="gift-banner">
        <div className="page-shell gift-layout">
          <div className="gift-number">?</div>
          <div className="gift-copy">
            <p className="eyebrow light">For the impossible-to-shop-for person</p>
            <h2>Tell us who they are.<br />We&apos;ll help you find the thing.</h2>
            <p>Answer four questions, review your commission request and send it to Sam. He&apos;ll reach out to schedule a short idea meeting before anything is designed.</p>
          </div>
          <Link className="button button-cream" href="/gift-finder">Commission a piece</Link>
        </div>
      </section>

      <section className="page-shell manifesto-section">
        <div className="manifesto-image"><img src="/assets/toolbox-bourbon-bar.webp" alt="Vintage toolbox transformed by Red Bucket into a bourbon bar" width={598} height={785} loading="lazy" decoding="async" /></div>
        <div className="manifesto-copy">
          <p className="eyebrow">Salvage · memory · obsession</p>
          <h2>The object already has a story.<br /><em>We give it a second act.</em></h2>
          <p>An aircraft wing becomes a table. A military tool case becomes a bourbon bar. Antique lanterns become a chandelier. The category does not matter. The idea does.</p>
          <Link className="text-link dark" href="/second-act">Open The Second Act <b>→</b></Link>
        </div>
      </section>

      <section className="page-shell bucket-list">
        <div>
          <p className="eyebrow">The Bucket List</p>
          <h2>One found object. One new build. No filler.</h2>
        </div>
        <NewsletterForm />
      </section>

      <SiteFooter />
    </main>
  );
}
