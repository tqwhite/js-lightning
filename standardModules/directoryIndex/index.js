#!/usr/local/bin/node
'use strict';

/* =========================================================================
 * jsLightning Reusable Directory Index
 * =========================================================================
 *
 * WHAT IT IS
 *   A drop-in index.js module for any directory served by jsLightning. It
 *   walks the directory it's serving and renders a styled, collapsible
 *   outline of the contents. Nothing is hardcoded — the served directory
 *   is computed from jslScope.configuration.docRootPath plus req.path,
 *   which means the same file works identically when copied directly into
 *   /25/, /foo/bar/, etc., AND when symlinked from those locations to a
 *   single canonical install. (We deliberately avoid __dirname because
 *   Node resolves require()'d symlinks to their real path — so a
 *   symlinked drop-in walking __dirname would always walk its own
 *   install directory instead of the served directory.)
 *
 * HOW TO DEPLOY
 *   1. Copy this file as index.js into the directory you want to index.
 *   2. That's it. jsLightning serves /path/to/dir/ -> /path/to/dir/index.js
 *      via its defaultPageNameList. The index will render automatically.
 *   3. Optionally drop any of the .jslightning-index-* marker files
 *      (below) into the directory or subdirectories to tweak presentation.
 *
 * STYLING
 *   Matches the sandstone/serif palette of the genericwhite.com feature
 *   pages (e.g., currentSummary.html). Georgia text, accent #8b4513,
 *   paper #fbfaf6, highlight #f4e4bc. Self-contained — no external CSS.
 *
 * MARKER FILES (all start with .jslightning-index-)
 *
 *   .jslightning-index-leaf
 *     Placed in a subdirectory. Forces that subdirectory to render as a
 *     single "leaf" link (opaque), no matter its contents. Use for
 *     directories you want to treat as black-box destinations.
 *
 *   .jslightning-index-anyway
 *     Placed in a subdirectory. Forces that subdirectory to be EXPANDED
 *     in the outline even if it contains an entry-point file (index.html
 *     etc.) that would normally collapse it to a leaf. Use when you want
 *     visitors to see the whole directory contents despite the presence
 *     of an index page. Overrides auto-leaf detection and .leaf marker.
 *
 *   .jslightning-index-anchor-text
 *     Placed in a subdirectory. Its trimmed contents become the display
 *     label for that directory's link (leaf mode) or header (expand mode),
 *     replacing the raw directory name. Use for human-readable labels.
 *
 *   .jslightning-index-title
 *     Placed in THIS directory (the one containing index.js — NOT
 *     subdirectories). Its trimmed contents become both the <title> and
 *     the page headline, replacing the default directory basename.
 *
 * LINK FILES (extension-style, NOT dotfiles)
 *
 *   Any file whose name ends in `.jslightning-link` is rendered as an
 *   external link line item in the outline, not as a content document.
 *
 *     Line 1: URL (required) — absolute http(s) URL, or a site-relative
 *             path beginning with '/'. Empty first line → file is skipped
 *             with a warning.
 *     Line 2: Display label (optional) — defaults to the filename minus
 *             the `.jslightning-link` suffix.
 *
 *   Cross-origin http(s) URLs open in a new tab (avoiding iframe sandbox
 *   blocking in split-view mode). Same-origin / path-relative URLs navigate
 *   in-page normally, or load into the split-view iframe when that mode
 *   is active — just like regular file links.
 *
 *   Link files alphabetize mingled with regular files at their own
 *   basename position, visually distinguished by a ↗ marker and italic
 *   accent color.
 *
 * LEAF VS EXPAND LOGIC (default, no markers)
 *   A subdirectory is rendered as a single leaf link if it contains any
 *   of: index, index.js, index.html. Otherwise it expands and its contents
 *   are listed recursively. The precedence when markers are present:
 *     1. .jslightning-index-anyway  -> expand (overrides all)
 *     2. .jslightning-index-leaf    -> leaf
 *     3. has index.*                -> leaf
 *     4. otherwise                  -> expand
 *
 * FEATURES
 *   - Collapsible outline: click any directory header to toggle
 *   - "Expand all" / "Collapse all" buttons below the main toggle
 *   - Substring filter: a search box next to the expand/collapse buttons
 *     filters files by case-insensitive substring match on the displayed
 *     label. While a filter is active, all directories auto-expand and
 *     directory headers with no matching descendants are hidden. Clearing
 *     the box restores the normal collapse state.
 *   - "Open pages here — split view" checkbox: transforms the page into
 *     a left sidebar + iframe layout. Link clicks load into the iframe
 *     instead of navigating. Preference persists in localStorage
 *     (key: jslIndexFramed).
 *   - Error-resilient walk: every fs call is wrapped so a single bad
 *     entry cannot crash the index. Warnings appear in a red block.
 *   - Reusable by design: relative to __dirname and req.originalUrl.
 *   - Content filter: only files with extensions in VISIBLE_EXTENSIONS
 *     (default: .js, .html, .pdf, .md) are listed in the outline. Image
 *     and binary asset files are skipped — they're still served by
 *     jsLightning when referenced, just not enumerated. Subdirectories
 *     whose entire content is filtered out are pruned from the outline.
 *
 * INTERNALS
 *   - walk(dirPath) returns [{type, rel, name, isLeafDir?, anchor?}, ...]
 *     in pre-order. Dirs sort first within each level, then files.
 *   - classifyDir(full) returns {mode: 'leaf'|'expand', entry?, anchor?}
 *     based on the marker files and entry-point detection.
 *   - applyCollapse() (client-side) walks the flat nav list maintaining
 *     a depth stack of active collapses; O(n), handles arbitrary nesting.
 *
 * KNOWN QUIRKS / DEPENDENCIES
 *   - Requires a patched jsLightning find-dynamic-page.js that applies
 *     defaultPageNameList to any directory request (not just '/') and
 *     restricts the docRoot-module fallback to req.path === '/'. Without
 *     the patch, /foo/ requests with no .js/.md may silently fall through
 *     to the docRoot's package.json "main" field — famously returning
 *     'HELLO WORLD' if startAll.js is set as main. See conversation at
 *     GRANITE_FALCON session 2026-04-07 for full diagnosis.
 *   - Static files (non-.js/.md) are served by jsLightning's static
 *     routing, so .html links in the outline rely on that working.
 *
 * =========================================================================
 */

const moduleFunction = template => function (req, res, jslScope) {
	const fs = require('fs');
	const path = require('path');

	const errors = [];
	const safe = (label, fn, fallback) => {
		try { return fn(); }
		catch (err) { errors.push(`${label}: ${err.message}`); return fallback; }
	};

	const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
	}[c]));

	const stripExt = s => s.replace(/\.(md|html)$/i, '');

	// A directory that declares its own entry point owns its own presentation.
	// We honor the same defaults jsLightning uses for routing, so what the
	// index shows matches what the server serves.
	const ENTRY_POINTS = ['index', 'index.js', 'index.html'];
	const LEAF_MARKER = '.jslightning-index-leaf';         // force collapse (opaque)
	const EXPAND_MARKER = '.jslightning-index-anyway';     // force expand (overrides entry point)
	const ANCHOR_MARKER = '.jslightning-index-anchor-text';// override the link label
	const LINK_SUFFIX = '.jslightning-link';               // extension for link files

	// Only files with these extensions appear in the rendered outline.
	// Other files (images, icons, fonts, binary assets) are still served
	// by jsLightning when referenced — they just don't clutter the listing.
	// Directories, leaf-dir links, and `.jslightning-link` files are
	// unaffected by this filter; a directory whose entire content is filtered
	// out is silently pruned from the outline.
	const VISIBLE_EXTENSIONS = new Set(['.js', '.html', '.pdf', '.md']);

	// Parse a .jslightning-link file. Returns { url, label } or null if the
	// file doesn't contain a usable URL on its first non-empty line.
	const parseLinkFile = (full, fallbackLabel) => {
		const content = safe(`read ${full}`, () => fs.readFileSync(full, 'utf8'), '');
		const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
		if (lines.length === 0) return null;
		const url = lines[0];
		const label = lines[1] || fallbackLabel;
		return { url, label };
	};

	// Decide whether a subdirectory should be collapsed to a single leaf link
	// or expanded into a full recursive listing. When collapsed, we also
	// report the specific entry-point filename so the caller can link
	// directly to it — this sidesteps a jsLightning quirk where a trailing
	// slash on a directory with only HTML content falls through the dynamic
	// resolver into the site-root package.json fallback (aka HELLO WORLD).
	const classifyDir = (full) => {
		const contents = safe(`readdir ${full}`, () => fs.readdirSync(full), []);
		const set = new Set(contents);

		// Anchor text is read once and returned to the caller regardless of
		// mode — though it only has an effect when the dir is rendered as
		// a leaf link.
		let anchor = null;
		if (set.has(ANCHOR_MARKER)) {
			anchor = safe(`read ${ANCHOR_MARKER} in ${full}`,
				() => fs.readFileSync(path.join(full, ANCHOR_MARKER), 'utf8').trim(),
				null);
			if (anchor === '') anchor = null;
		}

		if (set.has(EXPAND_MARKER)) return { mode: 'expand', anchor };
		if (set.has(LEAF_MARKER)) {
			// Opaque dir with no natural entry point — link at trailing slash.
			for (const ep of ENTRY_POINTS) {
				if (set.has(ep)) return { mode: 'leaf', entry: ep, anchor };
			}
			return { mode: 'leaf', entry: '', anchor };
		}
		for (const ep of ENTRY_POINTS) {
			if (set.has(ep)) return { mode: 'leaf', entry: ep, anchor };
		}
		return { mode: 'expand', anchor };
	};

	// Recursive walk. Each filesystem call is wrapped so a single bad entry
	// cannot kill the whole index.
	const walk = (dirPath, basePath = '') => {
		const out = [];
		const names = safe(`readdir ${dirPath}`, () => fs.readdirSync(dirPath), []);
		const items = [];
		for (const name of names) {
			if (name.startsWith('.')) continue;
			const full = path.join(dirPath, name);
			if (full === __filename) continue;
			const stat = safe(`stat ${name}`, () => fs.statSync(full), null);
			if (!stat) continue;
			items.push({ name, full, isDir: stat.isDirectory() });
		}
		// Directories first, then files, each alphabetized.
		items.sort((a, b) => {
			if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
			return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
		});
		for (const item of items) {
			const rel = basePath ? path.posix.join(basePath, item.name) : item.name;
			if (item.isDir) {
				const klass = classifyDir(item.full);
				if (klass.mode === 'leaf') {
					// Self-contained site: link at the directory with a
					// trailing slash. jsLightning's resolver will apply
					// defaultPageNameList to find the right entry point.
					out.push({
						type: 'file',
						rel: rel + '/',
						name: item.name,
						isLeafDir: true,
						anchor: klass.anchor
					});
				} else {
					// Recurse first; only emit the directory header if the
					// recursive walk produced any visible content. This
					// prunes empty (or fully-filtered) subdirectories.
					const childEntries = walk(item.full, rel);
					if (childEntries.length > 0) {
						out.push({ type: 'dir', rel, name: item.name, anchor: klass.anchor });
						out.push(...childEntries);
					}
				}
			} else if (item.name.endsWith(LINK_SUFFIX)) {
				// Link file — read URL + optional label.
				const fallbackLabel = item.name.slice(0, -LINK_SUFFIX.length);
				const parsed = parseLinkFile(item.full, fallbackLabel);
				if (parsed) {
					out.push({
						type: 'link',
						rel,
						name: item.name,
						url: parsed.url,
						label: parsed.label
					});
				} else {
					errors.push(`empty or invalid link file: ${rel}`);
				}
			} else {
				// Regular file: only show extensions in VISIBLE_EXTENSIONS.
				// Filtered-out files are still served by jsLightning when
				// referenced; they just don't appear in the listing.
				const ext = path.extname(item.name).toLowerCase();
				if (VISIBLE_EXTENSIONS.has(ext)) {
					out.push({ type: 'file', rel, name: item.name });
				}
			}
		}
		return out;
	};

	// Build the base URL from the incoming request so links are absolute and
	// portable. We want the directory that THIS index is serving, which is
	// whatever path the request came in on, minus any trailing filename.
	const rawUrl = (req.originalUrl || req.url || '/').split('?')[0].split('#')[0];
	const baseUrl = rawUrl.endsWith('/')
		? rawUrl
		: rawUrl.substring(0, rawUrl.lastIndexOf('/') + 1);

	// Determine the directory to walk. We DON'T use __dirname because Node
	// resolves require()'d symlinks to their real path — so a symlinked
	// drop-in would always walk its own install location instead of the
	// directory it's serving. Instead we derive the served directory from
	// jsLightning's docRootPath plus the request URL. This works whether
	// the index is a direct copy in the served directory, a symlink to the
	// canonical install, or anything else. __dirname is only used as a
	// fallback if jslScope.configuration.docRootPath isn't available
	// (e.g., running outside jsLightning).
	const docRootPath = jslScope && jslScope.configuration && jslScope.configuration.docRootPath;
	const parentDir = docRootPath ? path.join(docRootPath, baseUrl) : __dirname;
	const entries = safe('walk', () => walk(parentDir), []);

	// .jslightning-index-title, if present in THIS directory (not
	// subdirectories), replaces the directory name as both the browser tab
	// title and the page headline. The default is still the directory's
	// basename.
	const TITLE_MARKER = '.jslightning-index-title';
	let titleOverride = null;
	if (safe(`stat ${TITLE_MARKER}`, () => fs.existsSync(path.join(parentDir, TITLE_MARKER)), false)) {
		titleOverride = safe(
			`read ${TITLE_MARKER}`,
			() => fs.readFileSync(path.join(parentDir, TITLE_MARKER), 'utf8').trim(),
			null
		);
		if (titleOverride === '') titleOverride = null;
	}

	const dirName = path.basename(parentDir) || 'root';
	const displayTitle = titleOverride || dirName;
	const fileCount = entries.filter(e => e.type === 'file').length;
	const dirCount = entries.filter(e => e.type === 'dir').length;

	const navHtml = entries.map(e => {
		// Directory depth is the number of slashes in the relative path. A
		// leaf-dir entry has a trailing slash, which we discount.
		const cleanRel = e.rel.replace(/\/$/, '');
		const depth = (cleanRel.match(/\//g) || []).length;
		if (e.type === 'dir') {
			const d = depth + 1;
			const label = e.anchor ? e.anchor : `${e.name}/`;
			return `<div class="nav-dir" style="--d:${d}">${escapeHtml(label)}</div>`;
		}
		const d = depth + 1;
		if (e.type === 'link') {
			// External link file. Cross-origin http(s) URLs get target="_blank"
			// so the split-view iframe mode never tries to sandbox them (which
			// many sites block via X-Frame-Options). Same-origin and
			// path-relative URLs behave like ordinary file links.
			const isCrossOrigin = /^https?:\/\//i.test(e.url);
			const extClass = isCrossOrigin ? ' nav-linkfile-external' : '';
			const extAttr = isCrossOrigin ? ' target="_blank" rel="noopener noreferrer"' : '';
			return `<div class="nav-file nav-linkfile${extClass}" style="--d:${d}"><a href="${escapeHtml(e.url)}"${extAttr}>${escapeHtml(e.label)}</a></div>`;
		}
		if (e.isLeafDir) {
			// A self-contained sub-site. Default label is "name/" unless the
			// directory carries a .jslightning-index-anchor-text override.
			const href = baseUrl + e.rel;
			const label = e.anchor ? e.anchor : `${e.name}/`;
			return `<div class="nav-file nav-leafdir" style="--d:${d}"><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></div>`;
		}
		const display = stripExt(e.name);
		const href = baseUrl + e.rel;
		return `<div class="nav-file" style="--d:${d}"><a href="${escapeHtml(href)}">${escapeHtml(display)}</a></div>`;
	}).join('\n');

	const errorBlock = errors.length
		? `<div class="errors"><strong>Warnings (${errors.length}):</strong><ul>${
			errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')
		}</ul></div>`
		: '';

	const html = template
		.replace(/<!pageTitle!>/g, escapeHtml(displayTitle))
		.replace(/<!headline!>/g, escapeHtml(displayTitle))
		.replace(/<!subTitle!>/g, escapeHtml(baseUrl))
		.replace(/<!fileCount!>/g, String(fileCount))
		.replace(/<!dirCount!>/g, String(dirCount))
		.replace(/<!errorText!>/g, errorBlock)
		.replace(/<!bodyText!>/g, navHtml);

	res.send(html);
};

//END OF moduleFunction() ============================================================

const outputHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><!pageTitle!></title>
<style>
:root {
	--ink: #1a1a1a;
	--paper: #fbfaf6;
	--rule: #c4b896;
	--accent: #8b4513;
	--muted: #6b6b6b;
	--highlight: #f4e4bc;
	--bg: #e8e0c8;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
	background: var(--bg);
	font-family: Georgia, "Times New Roman", serif;
	color: var(--ink);
	line-height: 1.55;
}

/* ---------- NORMAL mode: centered page ---------- */
body.normal { padding: 2.5rem 1rem; min-height: 100vh; }
body.normal .page {
	max-width: 760px;
	margin: 0 auto;
	background: var(--paper);
	padding: 2.5rem 3rem 2rem 3rem;
	box-shadow: 0 4px 24px rgba(60, 40, 10, 0.18), 0 1px 2px rgba(60, 40, 10, 0.1);
	border-top: 4px solid var(--accent);
}
body.normal .content-frame { display: none; }

/* ---------- FRAMED mode: sidebar + iframe ---------- */
body.framed {
	height: 100vh;
	overflow: hidden;
	display: grid;
	grid-template-columns: 340px 1fr;
}
body.framed .page {
	background: var(--paper);
	border-right: 1px solid var(--rule);
	padding: 1.5rem 1.4rem 2rem 1.6rem;
	overflow-y: auto;
	box-shadow: inset -1px 0 0 var(--rule);
}
body.framed .content-frame {
	display: block;
	border: 0;
	width: 100%;
	height: 100vh;
	background: #fff;
}
body.framed .page-wide-only { display: none; }

/* ---------- Shared typography ---------- */
.eyebrow {
	text-transform: uppercase;
	letter-spacing: 0.18em;
	font-size: 0.72rem;
	color: var(--accent);
	font-weight: 600;
	margin-bottom: 0.3rem;
}
h1 {
	font-size: 1.7rem;
	line-height: 1.2;
	margin: 0 0 0.35rem 0;
	font-weight: 700;
	color: var(--ink);
}
.deck {
	font-style: italic;
	color: var(--muted);
	font-size: 0.92rem;
	margin: 0 0 1.2rem 0;
	border-bottom: 1px solid var(--rule);
	padding-bottom: 0.9rem;
	word-break: break-all;
}

.toggle {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	font-size: 0.8rem;
	color: #4a3318;
	margin: 0 0 0.5rem 0;
	padding: 0.55rem 0.8rem;
	background: var(--highlight);
	border: 1px solid var(--rule);
	border-left: 3px solid var(--accent);
	border-radius: 3px;
	cursor: pointer;
	user-select: none;
}
.toggle input { cursor: pointer; }

.outline-controls {
	display: flex;
	gap: 0.5rem;
	margin: 0 0 1rem 0;
	font-size: 0.72rem;
}
.outline-controls button {
	font-family: Georgia, serif;
	font-size: 0.72rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--accent);
	background: var(--paper);
	border: 1px solid var(--rule);
	border-radius: 3px;
	padding: 0.3rem 0.7rem;
	cursor: pointer;
	transition: background 0.12s ease;
}
.outline-controls button:hover {
	background: var(--highlight);
}
.outline-controls input[type="search"] {
	flex: 1;
	min-width: 8rem;
	font-family: Georgia, "Times New Roman", serif;
	font-size: 0.8rem;
	padding: 0.3rem 0.6rem;
	border: 1px solid var(--rule);
	border-radius: 3px;
	background: var(--paper);
	color: var(--ink);
}
.outline-controls input[type="search"]::placeholder {
	color: var(--muted);
	font-style: italic;
}
.outline-controls input[type="search"]:focus {
	outline: none;
	border-color: var(--accent);
	background: #fff8e6;
}

.stats {
	display: flex;
	gap: 1.3rem;
	margin: 0 0 1.2rem 0;
	padding: 0.7rem 0.9rem;
	background: #fff8e6;
	border: 1px solid var(--rule);
	border-radius: 4px;
	font-size: 0.72rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--muted);
}
.stats .stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
.stats .stat strong {
	color: var(--accent);
	font-size: 1.35rem;
	font-weight: 700;
	font-family: Georgia, serif;
	line-height: 1;
	margin-bottom: 0.15rem;
}

.nav { margin-top: 0.4rem; }
.nav-dir {
	font-family: Georgia, serif;
	font-size: 0.76rem;
	text-transform: uppercase;
	letter-spacing: 0.11em;
	color: var(--accent);
	font-weight: 600;
	margin: 1rem 0 0.25rem 0;
	padding: 0.15rem 0 0.2rem 0;
	padding-left: calc((var(--d) - 1) * 0.9rem);
	border-bottom: 1px solid var(--rule);
	cursor: pointer;
	user-select: none;
}
.nav-dir::before {
	content: "\\25BE";  /* ▾ down triangle */
	display: inline-block;
	width: 0.9em;
	color: var(--rule);
	font-style: normal;
	letter-spacing: 0;
}
.nav-dir.collapsed::before {
	content: "\\25B8";  /* ▸ right triangle */
}
.nav-dir:hover {
	color: #5a2a0a;
}
.nav-file {
	padding: 0.18rem 0;
	padding-left: calc(var(--d) * 0.9rem);
	font-size: 0.9rem;
}
.nav-file a {
	color: var(--ink);
	text-decoration: none;
	border-bottom: 1px dotted transparent;
	transition: border-color 0.15s ease, color 0.15s ease;
}
.nav-file a:hover {
	color: var(--accent);
	border-bottom-color: var(--accent);
}
.nav-file a.active {
	color: var(--accent);
	font-weight: 600;
	border-bottom-color: var(--accent);
}
.nav-leafdir a {
	color: var(--accent);
	font-style: italic;
}
.nav-leafdir a::before {
	content: "\\25B8  ";
	font-style: normal;
	color: var(--rule);
}
.nav-linkfile a {
	color: var(--accent);
	font-style: italic;
}
.nav-linkfile a::before {
	content: "\\2197  ";
	font-style: normal;
	color: var(--rule);
}

.errors {
	margin: 1rem 0;
	padding: 0.75rem 1rem;
	background: #fff1e6;
	border-left: 3px solid #b8441f;
	font-size: 0.82rem;
	color: #5a2214;
	border-radius: 3px;
}
.errors ul { margin: 0.35rem 0 0 1.1rem; padding: 0; }
.errors li { margin: 0.12rem 0; font-family: "Menlo", "Consolas", monospace; font-size: 0.76rem; }

footer {
	margin-top: 1.8rem;
	padding-top: 0.8rem;
	border-top: 1px solid var(--rule);
	font-size: 0.7rem;
	color: var(--muted);
	font-style: italic;
	text-align: center;
}
</style>
</head>
<body class="normal">
	<div class="page">
		<div class="eyebrow">Directory Index</div>
		<h1><!headline!></h1>
		<div class="deck"><!subTitle!></div>

		<label class="toggle">
			<input type="checkbox" id="frameToggle">
			<span>Open pages here&nbsp;&mdash;&nbsp;split view</span>
		</label>

		<div class="outline-controls">
			<button type="button" id="expandAllBtn">&#x25BE; Expand all</button>
			<button type="button" id="collapseAllBtn">&#x25B8; Collapse all</button>
			<input type="search" id="searchInput" placeholder="filter by name&hellip;" autocomplete="off" />
		</div>

		<div class="stats">
			<div class="stat"><strong><!fileCount!></strong><span>files</span></div>
			<div class="stat"><strong><!dirCount!></strong><span>folders</span></div>
		</div>

		<!errorText!>

		<nav class="nav">
			<!bodyText!>
		</nav>

		<footer>jsLightning index</footer>
	</div>
	<iframe class="content-frame" name="content-frame" src="about:blank" title="Selected page"></iframe>

<script>
(function () {
	var KEY = 'jslIndexFramed';
	var body = document.body;
	var toggle = document.getElementById('frameToggle');
	var links = Array.prototype.slice.call(document.querySelectorAll('.nav-file a'));

	function apply(framed) {
		body.classList.toggle('framed', framed);
		body.classList.toggle('normal', !framed);
		toggle.checked = framed;
		links.forEach(function (a) {
			// Leave explicitly-external link files (target="_blank") alone —
			// the server-side render already set their target, and forcing
			// them into the split-view iframe would often hit X-Frame-Options
			// blocks.
			var isExternal = a.closest('.nav-linkfile-external');
			if (isExternal) return;
			if (framed) a.setAttribute('target', 'content-frame');
			else a.removeAttribute('target');
		});
	}

	var saved = false;
	try { saved = localStorage.getItem(KEY) === '1'; } catch (e) {}
	apply(saved);

	toggle.addEventListener('change', function () {
		var on = toggle.checked;
		try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
		apply(on);
	});

	links.forEach(function (a) {
		a.addEventListener('click', function () {
			if (body.classList.contains('framed')) {
				links.forEach(function (x) { x.classList.remove('active'); });
				a.classList.add('active');
			}
		});
	});

	// --- Collapsible outline ---
	// Each nav item has a CSS var --d giving its tree depth. Clicking a
	// nav-dir toggles its .collapsed class; applyCollapse() then walks the
	// flat list of nav items and hides anything whose depth is inside an
	// active collapse scope.
	var navDirs = Array.prototype.slice.call(document.querySelectorAll('.nav-dir'));
	var allNav = Array.prototype.slice.call(document.querySelectorAll('.nav-dir, .nav-file'));

	function depthOf(el) {
		return parseInt(el.style.getPropertyValue('--d'), 10) || 0;
	}

	function applyCollapse() {
		var stack = []; // depths of currently collapsed ancestors
		allNav.forEach(function (el) {
			var d = depthOf(el);
			while (stack.length && stack[stack.length - 1] >= d) stack.pop();
			el.style.display = stack.length > 0 ? 'none' : '';
			if (el.classList.contains('nav-dir') && el.classList.contains('collapsed')) {
				stack.push(d);
			}
		});
	}

	navDirs.forEach(function (dir) {
		dir.addEventListener('click', function (ev) {
			ev.preventDefault();
			dir.classList.toggle('collapsed');
			applyCollapse();
		});
	});

	var expandAllBtn = document.getElementById('expandAllBtn');
	var collapseAllBtn = document.getElementById('collapseAllBtn');
	var searchInput = document.getElementById('searchInput');

	// --- Substring search ---
	// Filters nav-file entries by case-insensitive substring match on label.
	// An active search auto-expands all directories, then hides any files
	// that don't match and any directory headers whose descendants all got
	// hidden. Clearing the search restores the normal collapse state.
	function applySearch(query) {
		query = (query || '').trim().toLowerCase();
		var allFiles = Array.prototype.slice.call(document.querySelectorAll('.nav-file'));
		var allDirs = Array.prototype.slice.call(document.querySelectorAll('.nav-dir'));

		if (!query) {
			// Clear filter: reset inline display, reapply collapse state.
			allFiles.forEach(function (el) { el.style.display = ''; });
			allDirs.forEach(function (el) { el.style.display = ''; });
			applyCollapse();
			return;
		}

		// Auto-expand all directories so the filter's view is consistent.
		navDirs.forEach(function (d) { d.classList.remove('collapsed'); });

		// Pass 1: show/hide files by label match.
		allFiles.forEach(function (el) {
			var label = (el.textContent || '').trim().toLowerCase();
			el.style.display = label.indexOf(query) !== -1 ? '' : 'none';
		});

		// Pass 2: hide directory headers whose descendants are all hidden.
		// Process in reverse DOM order so inner dirs hide before their
		// parents check visibility of nested content.
		var all = Array.prototype.slice.call(document.querySelectorAll('.nav-dir, .nav-file'));
		for (var i = allDirs.length - 1; i >= 0; i--) {
			var dir = allDirs[i];
			var myDepth = depthOf(dir);
			var dirIdx = all.indexOf(dir);
			var hasVisible = false;
			for (var j = dirIdx + 1; j < all.length; j++) {
				var next = all[j];
				var nextDepth = depthOf(next);
				if (nextDepth <= myDepth) break;
				if (next.style.display !== 'none') { hasVisible = true; break; }
			}
			dir.style.display = hasVisible ? '' : 'none';
		}
	}

	if (searchInput) {
		searchInput.addEventListener('input', function () {
			applySearch(searchInput.value);
		});
	}

	// Expand/Collapse buttons clear any active search first, so the button's
	// effect is immediately visible instead of being masked by the filter.
	function clearSearch() {
		if (searchInput && searchInput.value) {
			searchInput.value = '';
			applySearch('');
		}
	}

	if (expandAllBtn) expandAllBtn.addEventListener('click', function () {
		clearSearch();
		navDirs.forEach(function (d) { d.classList.remove('collapsed'); });
		applyCollapse();
	});
	if (collapseAllBtn) collapseAllBtn.addEventListener('click', function () {
		clearSearch();
		navDirs.forEach(function (d) { d.classList.add('collapsed'); });
		applyCollapse();
	});
})();
</script>
</body>
</html>
`;

module.exports = moduleFunction(outputHtml);
