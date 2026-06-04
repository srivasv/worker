# wispr-flow-linux pkg worker

Cloudflare Worker that fronts the unofficial Wispr Flow Linux APT/DNF repo at
`pkg.wispr-flow-linux.dev`.

```
apt/dnf  ->  https://pkg.wispr-flow-linux.dev/...
                 │
                 ├─ /dists/*, /KEY.gpg, /rpm/*/repodata/*   ->  200 (passthrough
                 │                                               to gh-pages via
                 │                                               raw.githubusercontent.com)
                 └─ /pool/main/w/.../*.deb, /rpm/*/*.rpm     ->  302 to the main
                                                                 repo's GitHub
                                                                 Release asset
```

Binary bytes flow directly from `release-assets.githubusercontent.com` to the
user and never cross Cloudflare — the Worker only emits a few-hundred-byte
redirect responses. This sidesteps GitHub's 100 MB per-file push cap on the
`gh-pages` branch.

## How it maps a request to a release

Release tags are `v<repoVer>+wispr<wisprVer>`. The package filename embeds both
versions, so the Worker reconstructs the tag from the path:

| Request path | Redirects to |
|---|---|
| `/pool/main/w/wispr-flow/wispr-flow_1.5.619-1.0.0_amd64.deb` | `.../releases/download/v1.0.0+wispr1.5.619/wispr-flow_1.5.619-1.0.0_amd64.deb` |
| `/rpm/x86_64/wispr-flow-1.5.619-1.0.0-1.x86_64.rpm` | `.../releases/download/v1.0.0+wispr1.5.619/wispr-flow-1.5.619-1.0.0-1.x86_64.rpm` |

Everything else passes through to
`raw.githubusercontent.com/wispr-flow-linux/wispr-flow-linux/gh-pages`.

## Deploy

Automatic via `.github/workflows/deploy-worker.yml` on push to `main`. Requires
two repo secrets:

- `CLOUDFLARE_API_TOKEN` — scoped to the "Edit Cloudflare Workers" template
  (Workers Scripts Edit, Account Settings Read, Workers Routes Edit).
- `CLOUDFLARE_ACCOUNT_ID`.

`wispr-flow-linux.dev`'s DNS must be managed on the same Cloudflare account so
`custom_domain = true` in `wrangler.toml` can auto-create the
`pkg.wispr-flow-linux.dev` record.

Manual deploy: `wrangler deploy`.

## Status

The publish layer that populates `gh-pages` + Releases lives in the main repo
and is **gated** behind `vars.PUBLISH_ENABLED` (pending Wispr Flow's ToS). Until
a release is cut, this Worker binds the domain but has no content to serve; the
deploy probe tolerates a 404 on the metadata path for that reason.
