# Deploying the preview to Netlify

The site is one static HTML file built by `build.py`. Netlify builds it from the repo on every push.

## One-time setup (about five minutes)

1. **Browser key.** In Google Cloud Console (same project as the enrichment key) create a *second* API key:
   Credentials → Create credentials → API key. Then edit it:
   - Application restrictions: **Websites**, add `https://<your-site>.netlify.app/*` (and your real domain later).
   - API restrictions: **Places API (New)** and **Maps JavaScript API**.
   This key will be visible in the page source; the referrer restriction is what keeps it safe. Never use the
   unrestricted enrichment key in the browser.
2. **Netlify.** https://app.netlify.com → Add new site → Import an existing project → GitHub →
   `arutkowski1311-creator/LITTLibrary`. Branch to deploy: `claude/visual-polish-graphics-u5kcmc`.
   Netlify reads `netlify.toml`, so base directory, build command and publish directory fill in by themselves.
3. **Environment variable.** Site configuration → Environment variables → Add:
   `GOOGLE_MAPS_BROWSER_KEY` = the browser key from step 1.
4. Deploy. First build takes a minute or two (it installs Pillow and embeds the photos).

## What you will see

- Every entry Google matched (about 200) shows its first Google photo with the photographer's attribution, loaded
  live from Google at page view. Photos are never stored in the repo, which is what Google's terms require.
- The map on the Homes page switches from the schematic to Google Maps.
- Everything else is identical to the claude.ai preview.

## Later

- Point a real domain at Netlify (Domain management → Add domain) and add it to the key's referrer list.
- Merge the branch to `main` and switch Netlify's production branch to `main`.
