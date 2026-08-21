"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart-context";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/gift-finder", label: "Commission a Piece" },
  { href: "/second-act", label: "The Second Act" },
  { href: "/commercial", label: "Commercial" },
  { href: "/work", label: "Custom Builds" },
  { href: "/track", label: "Track a build" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  const current = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <>
      <div className="utility-bar">
        <span>Designed and built in Bridgewater, NJ</span>
        <span>
          Custom commissions + commercial fabrication ·{" "}
          <Link href="/gift-finder">Commission a piece</Link>
        </span>
      </div>
      <header className="site-header">
        <div className="page-shell nav-shell">
          <Link className="brand" href="/" aria-label="Red Bucket Design Co home">
            <img
              className="brand-logo"
              src="/assets/red-bucket-brand.png"
              alt=""
              width={54}
              height={54}
              fetchPriority="high"
            />
            <span className="brand-type">
              <b>Red Bucket</b>
              <small>Design Co.</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} aria-current={current(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <Link
              className="nav-cart"
              href="/shop"
              aria-label={
                count > 0
                  ? `Shopping bag, ${count} item${count === 1 ? "" : "s"}`
                  : "Shopping bag, empty"
              }
            >
              Bag <span data-filled={count > 0 ? "true" : undefined}>{count}</span>
            </Link>
            <Link className="button button-small" href="/gift-finder">
              Build with Sam
            </Link>
            <div className="mobile-menu" ref={menuRef}>
              <button
                type="button"
                className="menu-toggle"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="sr-only">{menuOpen ? "Close navigation" : "Open navigation"}</span>
                <i aria-hidden="true" />
                <i aria-hidden="true" />
              </button>
              <nav id="mobile-nav" aria-label="Primary" hidden={!menuOpen}>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={current(link.href)}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
