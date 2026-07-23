# Wispr Flow Linux APT Worker

Cloudflare Worker fronting the APT repository at `pkg.grimwulf.dev`.

```text
APT client -> pkg.grimwulf.dev
  metadata and KEY.gpg -> srivasv/wispr-flow-linux gh-pages
  .deb files           -> srivasv/wispr-flow-linux GitHub Releases
```

The Worker redirects binary requests instead of proxying their contents, so
package bytes flow directly from GitHub's release CDN.

## Deploy

Pushes to `main` deploy through `.github/workflows/deploy-worker.yml`. The
repository needs these Actions secrets:

- `CLOUDFLARE_API_TOKEN` — Workers Scripts Write and Account Settings Read for
  the selected account, plus Workers Routes Write for the `grimwulf.dev` zone.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account containing that zone.

The Custom Domain in `wrangler.toml` creates the `pkg.grimwulf.dev` DNS record
and certificate automatically; do not create an A or CNAME record manually.
