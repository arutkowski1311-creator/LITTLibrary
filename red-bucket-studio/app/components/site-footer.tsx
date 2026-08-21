import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-main">
        <div className="footer-brand">
          <img className="brand-logo large" src="/assets/red-bucket-brand.png" alt="Red Bucket Design Co." width={116} height={108} loading="lazy" decoding="async" />
          <h2>What&apos;s sitting in your garage, hangar, station house, basement, or head?</h2>
          <Link className="button button-primary" href="/second-act">Give it a second act</Link>
        </div>
        <div className="footer-links">
          <div><p>Explore</p><Link href="/shop">Shop</Link><Link href="/gift-finder">Commission a Piece</Link><Link href="/second-act">The Second Act</Link><Link href="/commercial">Commercial</Link></div>
          <div><p>Studio</p><Link href="/work">Custom Builds</Link><Link href="/track">Track a build</Link><Link href="/ops">Sam&apos;s dashboard</Link><Link href="/shopboard">Shopboard</Link></div>
          <div><p>Connect</p><a href="mailto:redbucketdesignco@gmail.com">Email the studio</a><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram ↗</a><span>Bridgewater, New Jersey</span></div>
        </div>
      </div>
      <div className="page-shell footer-bottom"><span>© 2026 Red Bucket Design Co.</span><span>Built to become something better.</span></div>
    </footer>
  );
}
