import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { GiftFinder } from "./gift-finder";

export const metadata: Metadata = { title: "Commission a Piece", description: "Tell Sam who it is for, what matters to them, the occasion and the budget. Review and submit a custom commission request." };
export default function GiftFinderPage() { return <main id="main"><SiteHeader /><GiftFinder /><SiteFooter /></main>; }
