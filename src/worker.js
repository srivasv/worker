// APT binary distribution Worker.
//
// Pass-through requests for repo metadata (dists/, KEY.gpg, repodata/, etc.)
// to the gh-pages origin of the main repo. 302-redirect .deb requests to
// GitHub Release assets, which CI publishes for every tagged release.
//
// The Worker only emits redirect responses; binary bytes flow directly from
// release-assets.githubusercontent.com to the user, never crossing Cloudflare.

// Raw gh-pages content, bypassing the Pages routing layer. Fetching via the
// github.io Pages URL auto-301s back to pkg.<domain> once the CNAME is in
// place (Pages' custom-domain redirect), creating a loop through this Worker.
// raw.githubusercontent.com serves the same branch content directly and is
// unaffected by the custom-domain config.
const ORIGIN =
	'https://raw.githubusercontent.com/srivasv/wispr-flow-linux/gh-pages';
const RELEASES =
	'https://github.com/srivasv/wispr-flow-linux/releases/download';

// wispr-flow_<wisprVer>-<repoVer>_<arch>.deb
// wisprVer has no hyphen; repoVer runs up to the _<arch> separator.
const DEB_RE = new RegExp(
	'^/pool/main/w/wispr-flow/(?<asset>wispr-flow_' +
		'(?<wisprVer>[^-]+)-(?<repoVer>[^_]+)_(?:amd64|arm64)\\.deb)$'
);

export default {
	async fetch(request) {
		const url = new URL(request.url);
		const m = DEB_RE.exec(url.pathname);
		if (m) {
			const { asset, wisprVer, repoVer } = m.groups;
			const tag = `v${repoVer}+wispr${wisprVer}`;
			return Response.redirect(`${RELEASES}/${tag}/${asset}`, 302);
		}
		return fetch(ORIGIN + url.pathname + url.search, request);
	},
};
