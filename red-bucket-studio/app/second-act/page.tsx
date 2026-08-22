import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { SecondActForm } from "./second-act-form";

export const metadata: Metadata = { title: "The Second Act", description: "Show Red Bucket the object you cannot throw away. Upload a photo and work with Sam to give it a useful second life." };
export default function SecondActPage() { return <main id="main"><SiteHeader /><SecondActForm /><SiteFooter /></main>; }
