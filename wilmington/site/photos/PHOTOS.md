# Photographs for the concierge library

## Why most cards still say "Photograph to come"

Three constraints, all real:

1. **Rights.** Pulling pictures "off the web" for a commercial rental site is copyright infringement unless the
   image is licensed for it. AllTrails, Yelp and Tripadvisor photos belong to their users and platforms; their terms
   forbid reuse. We only place photos we have the right to show.
2. **The preview build embeds every image.** The claude.ai preview cannot load images from other hosts, so every
   photo is baked into the page as data. 277 entries at ~40 KB each is ~11 MB on top of the 4 MB page, right at the
   16 MB ceiling. The preview will always carry a curated subset, not the whole library.
3. **This build environment has no image access.** The organisation's egress policy allows only the Google APIs
   host; Wikimedia, Unsplash, Flickr and every venue site are blocked, so nothing can be downloaded here.

## The plan that works

| Source | Rights | How it gets in |
|---|---|---|
| **Google Places photos** (via the owner's Maps Platform key) | Licensed for display in a Maps Platform app, with the author attribution the API returns | `concierge/enrich_google.py` stores the photo reference + attribution on each entry; the production site renders it through the Places Photo endpoint. Covers restaurants, bars, shops, attractions and most trailheads. |
| **Owner and partner photos** | Owned | Drop into `site/photos/` using the slot names in `README.md`; `build.py` embeds them. Best for the homes, the Notch, the river, Whiteface. |
| **Venue-supplied press images** | Granted on request | Ask each go-to restaurant and outfitter for one image; most say yes for a link. |
| **Wikimedia Commons (CC BY / CC BY-SA)** | Free with attribution | For landmarks (Whiteface, Ausable Chasm, Olympic venues, High Peaks summits). Fetch from a normal network, save as `photos/<slot>.jpg`, record licence + author in `credits.json`. |
| **Unsplash / Pexels** | Free licence | Generic Adirondack scenery for category placeholders. |

Every placed photo gets a line in `credits.json` (`source`, `author`, `license`, `url`) and the site prints the credit.

## What to do first
1. Send the Google Maps Platform key (Places API (New) enabled, HTTP-referrer restricted to the site domain).
2. Run `GOOGLE_MAPS_KEY=… python3 concierge/enrich_google.py` from a machine with internet access. It fills
   ratings, hours, phones, websites, Google's review summaries and a photo reference for every entry it can match.
3. Send 20–30 of your own photos for the hero slots listed in `README.md`.
