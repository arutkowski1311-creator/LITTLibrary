# Media folder — drop your photos & videos here

The site reads media paths from `../js/config.js`. Add your files here, then point
`config.js` at them.

## Required / recommended files

| File | What it is | Used where |
|------|-----------|------------|
| `flyover.mp4` | Your drone flyover video (H.264 .mp4, ideally < 15 MB, muted) | Full-screen hero background |
| `hero-poster.jpg` | A still frame from the flyover (1920×1080) | Shown before the video loads + social preview |
| `gallery/*.jpg` `.mp4` | Photos & videos of both properties + the area | Gallery + property cards |

## Tips
- **Compress the flyover** so mobile loads fast: aim for 1080p, ~5–10 Mbps, no audio.
  e.g. `ffmpeg -i raw.mov -vf scale=1920:-2 -an -b:v 6M flyover.mp4`
- Also export a **shorter/lighter** version for phones if the file is large.
- Name gallery files clearly and tag them in `config.js` (`main`, `perch`, `area`)
  so the filters and property cards pick them up.
- The share-card carousel uses the images listed under `media.shareImages`.

Until you add files, the site shows tasteful gradient placeholders — nothing breaks.
