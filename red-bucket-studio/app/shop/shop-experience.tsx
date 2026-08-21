"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "../lib/catalog";
import { shotskiColleges } from "../lib/catalog";
import { useCart } from "../components/cart-context";

const speedOptions = [
  { name: "Standard", detail: "Ships in the normal build window", fee: 0, days: 0 },
  { name: "Priority", detail: "Moves ahead of standard orders", fee: 35, days: -3 },
  { name: "Rush", detail: "First available bench slot", fee: 75, days: -6 },
];

export function ShopExperience({ initialProductSlug, products }: { initialProductSlug?: string; products: CatalogProduct[] }) {
  const { addItem, count: bagCount } = useCart();
  const [category, setCategory] = useState("Everything");
  const [selected, setSelected] = useState<CatalogProduct | null>(() => products.find((product) => product.slug === initialProductSlug) ?? null);
  const [finish, setFinish] = useState("Natural matte");
  const [personalization, setPersonalization] = useState("");
  const [lighting, setLighting] = useState(false);
  const [school, setSchool] = useState(shotskiColleges[0]);
  const [customSchool, setCustomSchool] = useState("");
  const [speed, setSpeed] = useState("Standard");
  const [zip, setZip] = useState("");
  const [shipping, setShipping] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const categories = useMemo(() => ["Everything", ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const speedOption = speedOptions.find((item) => item.name === speed) ?? speedOptions[0];
  const price = useMemo(() => selected ? selected.price + speedOption.fee + (lighting ? 45 : 0) + (finish === "Hand-rubbed walnut" ? 18 : 0) : 0, [selected, speedOption.fee, lighting, finish]);
  const visibleProducts = useMemo(() => category === "Everything" ? products : products.filter((product) => product.category === category), [category, products]);
  const shipDays = selected ? Math.max(3, selected.leadTimeDays + speedOption.days) : 0;

  const resetOptions = useCallback(() => {
    setPersonalization(""); setLighting(false); setFinish("Natural matte"); setSpeed("Standard"); setShipping(null); setNotice("");
  }, []);

  function chooseProduct(product: CatalogProduct) {
    setSelected(product);
    resetOptions();
    window.history.pushState({}, "", `/shop?product=${product.slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeProduct() {
    setSelected(null);
    window.history.pushState({}, "", "/shop");
  }

  // Back and forward move between the grid and a piece the way visitors expect.
  useEffect(() => {
    function syncFromUrl() {
      const slug = new URLSearchParams(window.location.search).get("product");
      setSelected(products.find((product) => product.slug === slug) ?? null);
      resetOptions();
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [products, resetOptions]);

  async function shareProduct(product: CatalogProduct) {
    const data = { title: product.name, text: "This feels like something Red Bucket should make.", url: `${window.location.origin}/shop?product=${product.slug}` };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); setNotice("Product link copied."); }
    } catch { /* Native share was dismissed. */ }
  }

  if (selected) return <section className="customizer-page">
    <div className="page-shell customizer-topline"><button onClick={closeProduct}>← Back to shop</button><button onClick={() => shareProduct(selected)}>Share this piece ↗</button></div>
    <div className="page-shell customizer-layout">
      <div className="customizer-visual"><img src={selected.image} alt={selected.alt} decoding="async" /><div className="preview-stamp"><span>Made for</span><b>{selected.slug === "shotski" ? (school === "Custom college or mountain" ? customSchool || "Your mountain" : school) : personalization || "Your story"}</b></div></div>
      <div className="customizer-panel">
        <p className="eyebrow">Made to order · {selected.inventory} available</p><h1>{selected.name}</h1><p className="customizer-description">Choose every detail and the delivery speed. Rush and priority orders automatically move up Sam&apos;s production board.</p>
        <div className="stock-line"><span className="status-dot" /><b>{selected.inventory > 5 ? "Ready to customize" : `Only ${selected.inventory} build slots left`}</b></div>

        {selected.slug === "shotski" && <div className="shotski-options"><label className="field-label" htmlFor="school">College or mountain</label><select className="studio-input" id="school" value={school} onChange={(event) => setSchool(event.target.value)}>{shotskiColleges.map((college) => <option key={college}>{college}</option>)}</select>{school === "Custom college or mountain" && <input className="studio-input" value={customSchool} onChange={(event) => setCustomSchool(event.target.value)} placeholder="Tell us the school, mountain or club" />}<div className="fixed-option"><span>Included</span><b>Four mounted glasses</b><small>Built and spaced for four people.</small></div></div>}

        <label className="field-label">Personalization <span>Optional</span></label><input className="studio-input" value={personalization} onChange={(event) => setPersonalization(event.target.value)} placeholder="Name, date, phrase, colors or crest" maxLength={80} />
        <label className="field-label" htmlFor="finish">Finish</label><select className="studio-input" id="finish" value={finish} onChange={(event) => setFinish(event.target.value)}><option>Natural matte</option><option>Hand-rubbed walnut</option><option>Weathered charcoal</option><option>Red Bucket red</option></select>
        {selected.category === "Signs" && <label className="option-row"><span><b>Add integrated lighting</b><small>Warm white, concealed wiring</small></span><span className="option-price">+$45</span><input type="checkbox" checked={lighting} onChange={(event) => setLighting(event.target.checked)} /></label>}

        <label className="field-label">How fast do you need it?</label><div className="speed-picker">{speedOptions.map((option) => <button type="button" className={speed === option.name ? "active" : ""} aria-pressed={speed === option.name} onClick={() => setSpeed(option.name)} key={option.name}><span><b>{option.name}</b><small>{option.detail}</small></span><strong>{option.fee ? `+$${option.fee}` : "Included"}</strong></button>)}</div><p className="ship-promise">Current estimate: leaves the workshop in <b>{shipDays} business days</b>.</p>
        <div className="shipping-box"><div><b>Estimate shipping</b><span>Pickup in Bridgewater is always free.</span></div><div className="zip-row"><input value={zip} onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="ZIP code" inputMode="numeric" /><button onClick={() => zip.length === 5 && setShipping(selected.slug === "shotski" ? 34 : selected.category === "Furniture & lighting" ? 89 : 14)}>Check</button></div>{shipping !== null && <p>Estimated ground shipping: <b>${shipping}.00</b> · tracked after completion</p>}</div>
        <div className="customizer-total"><span>Your piece</span><strong>${price}.00</strong></div><button className="add-bag" onClick={() => { addItem({ slug: selected.slug, name: selected.name, price, speed, finish, personalization: selected.slug === "shotski" ? (school === "Custom college or mountain" ? customSchool : school) : personalization, image: selected.image }); setNotice(`${selected.name} added to your bag as a ${speed.toLowerCase()} order.`); }}>Add to bag <span>→</span></button><button className="apple-pay" onClick={() => setNotice("Secure Apple Pay activates when the Shopify store is connected.")}><span></span> Pay</button>
        <div className="trust-row"><span>✓ Secure checkout</span><span>✓ Proof before custom work</span><span>✓ Live build tracking</span></div>{(notice || bagCount > 0) && <div className="shop-notice" role="status"><b>{notice}</b>{bagCount > 0 && <span>{bagCount} item{bagCount === 1 ? "" : "s"} in bag</span>}</div>}
      </div>
    </div>
  </section>;

  return <><section className="shop-hero page-shell"><p className="eyebrow">Made here. Made personal.</p><h1>Objects with history.<br /><em>Made for right now.</em></h1><p>Limited finds, customizable favorites and pieces that start with someone else&apos;s castoff. Choose the details and the deadline.</p></section><section className="page-shell shop-catalog"><div className="filter-row" aria-label="Product filters">{categories.map((item) => <button className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{item}</button>)}<span>{visibleProducts.length} piece{visibleProducts.length === 1 ? "" : "s"}</span></div><div className="catalog-grid">{visibleProducts.map((product) => <article className="catalog-card" key={product.slug}><button className="catalog-image" onClick={() => chooseProduct(product)}><img src={product.image} alt={product.alt} loading="lazy" decoding="async" /><span className="product-badge">{product.badge}</span><span className="catalog-customize">Make it yours <b>+</b></span></button><div className="catalog-info"><button onClick={() => chooseProduct(product)}><h2>{product.name}</h2><p>{product.detail}</p><small>{product.inventory} available · {product.leadTimeDays} day build</small></button><div><b>From ${product.price}</b><button aria-label={`Share ${product.name}`} onClick={() => shareProduct(product)}>↗</button></div></div></article>)}</div>{notice && <div className="toast" role="status">{notice}</div>}</section><section className="shop-commission page-shell"><div><p className="eyebrow light">Have the object but not the plan?</p><h2>Good. Bring us the weird thing.</h2></div><a className="button button-cream" href="/second-act">Open The Second Act</a></section></>;
}
