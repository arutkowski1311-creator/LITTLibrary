import type { Metadata } from "next";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { TrackExperience } from "./track-experience";

export const metadata: Metadata = { title: "Track Your Build | Red Bucket Design Co", description: "See the current stage and expected completion of your Red Bucket custom build." };
export default function TrackPage() { return <main id="main"><SiteHeader /><TrackExperience /><SiteFooter /></main>; }
