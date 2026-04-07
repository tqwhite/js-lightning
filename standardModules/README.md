# jsLightning Standard Modules

Reusable drop-in modules that ship with jsLightning. Each entry in this directory is a self-contained piece of functionality you can copy into any jsLightning site to add a standard capability without wiring anything up.

## Philosophy

Standard modules are intentionally self-contained. They:

- Use only Node core and, where essential, libraries already bundled with jsLightning (`qtools-functional-library`, etc.)
- Do not reach into jsLightning internals — they rely only on the public page-module interface `(req, res, jslScope) => ...`
- Work identically wherever they are dropped, introspecting their own location via `__dirname` and building absolute links from `req.originalUrl`
- Are short enough to read, understand, and edit per-site if local tweaks are wanted

If you find yourself needing to edit a standard module to make it work in a new site, that is a signal the module is not reusable enough and should be fixed here rather than forked there.

## How to deploy a standard module

Every standard module is either a single file (like `directoryIndex/index.js`) or a directory you copy wholesale. Deployment is always the same: **copy it to the place in your site where you want it to appear.**

Because jsLightning's default page name list includes `index.js`, a directory-level module dropped in as `someDir/index.js` is automatically served when visitors request `someDir/`.

There is no registration step, no configuration file, no restart required. Add the file, request its URL, see the result.

## Current modules

### directoryIndex

A styled, collapsible directory index with an optional split-view iframe mode.

**Location:** `directoryIndex/index.js`

**Deploy:** Copy it as `index.js` into any directory you want to advertise. Visitors browsing to that directory will see a sandstone-themed outline of the contents. Subdirectories that contain their own entry point collapse to a single leaf link; subdirectories without one are expanded and recursively listed.

**Marker files** (drop any of these into a directory to tweak presentation):

| File | Placed in | Effect |
|---|---|---|
| `.jslightning-index-leaf` | a subdirectory | Force collapse — treat the dir as an opaque destination |
| `.jslightning-index-anyway` | a subdirectory | Force expand — show contents even if an entry point exists |
| `.jslightning-index-anchor-text` | a subdirectory | Override the link/header label with the file's contents |
| `.jslightning-index-title` | **this** directory | Override the browser tab title and page headline |

**Link files** (extension-style, visible and greppable — not dotfiles):

Any file whose name ends in `.jslightning-link` is rendered as an external link line item in the outline, alphabetized mingled with regular files and visually marked with a ↗ arrow.

File contents:

- **Line 1** — URL (required). Absolute `http(s)://` URLs open in a new tab; same-origin or path-relative URLs behave like regular file links.
- **Line 2** — display label (optional). Defaults to the filename minus `.jslightning-link`.

Example:

```
$ cat previousYear.jslightning-link
/25/
Previous year (2025)
```

**Features:**

- Collapsible outline (click directory headers to toggle; expand-all / collapse-all buttons)
- "Open pages here" split-view checkbox — turns the page into a sidebar + iframe layout; preference persists in `localStorage`
- Error-resilient walk: a single bad file cannot crash the index; warnings appear in a red block at the top
- Reusable by construction — nothing hardcoded to any particular path

See the top-of-file doc block in `directoryIndex/index.js` for the complete reference, including internals and known quirks.

## Adding a new standard module

Create a new subdirectory with a meaningful name. Place the module file(s) inside. Add a section to this README describing what it does, where to drop it, and any markers or configuration it honors.

Good candidates for future standard modules: a site-map generator, a shared nav-header include, a friendly 404 page, a markdown-bundle renderer.
