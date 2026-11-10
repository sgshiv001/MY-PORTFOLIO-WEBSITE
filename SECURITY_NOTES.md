# Portfolio security and operations

## Application and deployment

- HTTPS/TLS is managed by the hosting provider. The public domain negotiated TLS 1.3 with AES-256-GCM during verification on 10 October 2026.
- The Worker redirects HTTP to HTTPS and sends `Strict-Transport-Security: max-age=31536000` over HTTPS. It deliberately does not enable subdomain-wide HSTS or preload.
- CSP allows same-origin scripts/fonts/styles, the required GitHub image hosts, public GitHub API reads, and local/data images. Inline executable scripts and inline event handlers are blocked. Inline styles remain allowed because the animations use them.
- `frame-ancestors 'none'` and `X-Frame-Options: DENY` prevent framing. `X-Content-Type-Options: nosniff` and explicit MIME types protect file interpretation.
- Referrer policy is `strict-origin-when-cross-origin`. Permissions policy disables camera, microphone, geolocation, payment, USB, serial and screen capture. Cross-origin opener policy is `same-origin`.
- The Worker serves only the files in its generated allowlist. The allowlist excludes editable source, configuration, environment files, source maps, the Worker itself, and `_headers`.
- Only GET and HEAD are accepted. Unknown paths return 404; malformed encodings return 400; write methods return 405. There is no server-side form, account system, database or upload endpoint.
- JS/CSS use SHA-384 subresource integrity and content-hashed filenames. Public scripts are minified with no source maps. Minification is not encryption and does not prevent copying.
- GitHub content is public and read without a private API token. README text and links are rendered safely; scripts and unsafe URL schemes are covered by regression tests.
- The contact form prepares a mailto draft; the visitor sends it from their own email app. The website does not store messages.

## Checks and recovery

`npm test` verifies the compiled portfolio interactions, hostile README input, every public asset byte-for-byte, response headers, redirects, GET/HEAD/cache handling, denied paths and methods, and PDF byte ranges. `npm audit` reported zero known advisories for installed build/test dependencies on 10 October 2026; the deployed Worker has no runtime package dependencies.

For local HTTP preview, `npm run dev` omits HSTS and the HTTPS-upgrade directive only in its loopback adapter. The production Worker retains both. Run `npm run build` and `npm test` before publishing; verify real response headers after deployment because a successful upload alone does not prove that host-specific configuration is applied.

Keep a dated editable-source archive and the previous saved Site version. Source and deployment versions permit recovery; backups in the same workspace do not protect against losing the whole device. Keep a second copy in user-controlled storage.

## Account actions requiring the owner

GitHub and Namecheap required sign-in when checked. Two-factor authentication status, registrar transfer lock, renewal reminders and account security alerts have not been verified or changed. The owner must complete sign-in and register their own authenticator/passkey, retain recovery codes securely, and protect the email/ChatGPT account used to manage hosting. Do not place passwords, setup secrets, recovery codes or private API tokens in the site or this document.

Review domain expiration and renewal notices in Namecheap; automatic paid renewal was not enabled. No new paid service, CDN plan, database, messaging service or recurring automation is required by this update.

These checks cover the implemented controls and observed behavior; they are not a guarantee against every attack or a full independent penetration test.
