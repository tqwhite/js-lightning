#!/usr/local/bin/node
'use strict';

/* =========================================================================
 * jsLightning Reusable Directory Index
 * =========================================================================
 *
 * WHAT IT IS
 *   A drop-in index.js module for any directory served by jsLightning. It
 *   recursively walks the directory it lives in and renders a styled,
 *   collapsible outline of the contents. Nothing is hardcoded — it uses
 *   __dirname for the filesystem root and req.originalUrl to build
 *   absolute links that work regardless of the mount point, so the SAME
 *   file works identically in /25/, /foo/bar/, or any other location.
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
 *   - "Open pages here — split view" checkbox: transforms the page into
 *     a left sidebar + iframe layout. Link clicks load into the iframe
 *     instead of navigating. Preference persists in localStorage
 *     (key: jslIndexFramed).
 *   - Error-resilient walk: every fs call is wrapped so a single bad
 *     entry cannot crash the index. Warnings appear in a red block.
 *   - Reusable by design: relative to __dirname and req.originalUrl.
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
					out.push({ type: 'dir', rel, name: item.name, anchor: klass.anchor });
					out.push(...walk(item.full, rel));
				}
			} else {
				out.push({ type: 'file', rel, name: item.name });
			}
		}
		return out;
	};

	const parentDir = __dirname;
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

	// Build the base URL from the incoming request so links are absolute and
	// portable. We want the directory that THIS index is serving, which is
	// whatever path the request came in on, minus any trailing filename.
	const rawUrl = (req.originalUrl || req.url || '/').split('?')[0].split('#')[0];
	const baseUrl = rawUrl.endsWith('/')
		? rawUrl
		: rawUrl.substring(0, rawUrl.lastIndexOf('/') + 1);

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
		if (e.isLeafDir) {
			// A self-contained sub-site. Default label is "name/" unless the
			// directory carries a .index-anchor-text override.
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
	if (expandAllBtn) expandAllBtn.addEventListener('click', function () {
		navDirs.forEach(function (d) { d.classList.remove('collapsed'); });
		applyCollapse();
	});
	if (collapseAllBtn) collapseAllBtn.addEventListener('click', function () {
		navDirs.forEach(function (d) { d.classList.add('collapsed'); });
		applyCollapse();
	});
})();
</script>
</body>
</html>
`;

module.exports = moduleFunction(outputHtml);
