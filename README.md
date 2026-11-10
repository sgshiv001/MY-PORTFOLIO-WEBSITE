# Shivanshu Gupta portfolio

Editable HTML, CSS and JavaScript are in `src/`. The published static site is in `dist/`; hosting serves only that directory.

Install development dependencies with `npm ci`, build with `npm run build`, and verify with `npm test`. The build combines and minifies browser assets, adds content hashes and integrity checks, and omits source maps. Browser files are generated in `public-site/`; `dist/server/index.js` embeds the allowlisted files in a dependency-free Worker that sends security headers. Rebuild after editing `src/`, `worker/` or `security-headers.mjs`. Keep the font licenses and resume assets. Use `npm run dev` for loopback preview.

The default appearance follows the visitor's device. The top-right sun/moon icon switches theme and saves the choice locally. Use the adjacent “Use device theme” action to restore automatic syncing. Decorative motion is on by default and follows the device's reduced-motion accessibility setting.

The GitHub project reel supports mouse dragging, native touch swiping, arrows and keyboard navigation. InvenTrack is featured first; LapCont and NEET Fortress are labeled with their test/prototype status. Project showcases read public GitHub metadata and READMEs with saved copies for offline fallback. Artwork is labeled separately from screenshots.

The Certificates chapter contains the Google Foundations of Cybersecurity course certificate listed on LinkedIn and verified on Coursera, completed 13 October 2025 (BCR0WHSA0QHW). It does not claim completion of the full Google Cybersecurity Professional Certificate program. Certificate images and project artwork are stored locally in both `src/assets/` and `dist/assets/`; keep both copies in sync when replacing an asset.

Public browser code cannot be kept secret or meaningfully encrypted. Minification makes the published scripts more compact; it does not provide encryption or hide public profile information. This site contains no private API keys and reads public GitHub repositories without a token. The contact form prepares an email draft for the visitor to send.

The deployment manifest intentionally omits `static`. This host serves `_headers` as an ordinary file rather than applying it, so the Worker attaches CSP, HSTS, anti-framing, MIME-type, referrer and permission policies to every response. The portable browser export includes `_headers` for hosts that support that convention; it is excluded from the Worker's public allowlist. Do not switch this Sites deployment back to static or publish the Worker file as an asset.

See `SECURITY_NOTES.md` for the implemented protections, verification and account tasks. Before changing dependencies, run `npm audit` and review any proposed updates; do not apply breaking upgrades automatically. Retain a dated source backup and a working saved Site version before publication.

Keep the existing Site identity and custom domain in `.openai/hosting.json`. `robots.txt` and `sitemap.xml` identify https://shivanshuguptaportfolio.me/.
