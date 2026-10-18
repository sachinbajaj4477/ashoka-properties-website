# Ashoka Properties website

Website for Ashoka Properties (a unit of Ashokaa Smart LLP), property consultant in Sonipat & Jindal Global City.

## What's here

- `index.html`, `css/`, `js/`, `images/` — the site. `js/scene.js` is the 3D villa in the hero (Three.js); `js/main.js` runs the scroll animations (GSAP + Lenis) and the WhatsApp enquiry form.
- `dist/index.html` — the same site as one self-contained file (photos load from Unsplash, logo embedded). Use it where you can only upload a single file.
- `dist/ai-studio-prompt.txt` — `dist/index.html` with instructions on top, for pasting into Google AI Studio.

## Run locally

```bash
python -m http.server 8766
```

Then open http://localhost:8766. The 3D and animation libraries load from CDNs, so an internet connection is needed.

## Hosting

Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages). Upload the repository root, or just `dist/index.html`.

Photos are from Unsplash (free to use under the Unsplash License).
