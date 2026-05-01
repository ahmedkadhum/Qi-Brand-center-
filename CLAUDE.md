# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, multi-page marketing/brand-guidelines site for the **Qi** brand. No build step, no framework — vanilla HTML, one shared CSS file, one shared JS file. Each `*.html` at the repo root is a standalone page that links to `assets/css/styles.css` and `assets/js/main.js`.

The repo lives at a path with a **trailing space**: `/Users/ahmed/Desktop/Qi brand Cnter ` — always quote it in shell commands.

## Running locally

The project ships with [serve.py](serve.py), a single-file Python static server bound to `127.0.0.1:8765`. The `ROOT` path inside it is hard-coded to the absolute repo path (with the trailing space) — if you copy `serve.py` elsewhere (e.g. `/tmp/qi-serve.py`, which `.claude/launch.json` expects), keep `ROOT` pointing at the real source dir so edits are served live.

```sh
# from the repo root
python3 serve.py                     # serves at http://127.0.0.1:8765
PORT=9000 python3 serve.py           # override port

# stop a stray server
pkill -f qi-serve.py                 # if launched via /tmp copy
```

There is no test suite, lint config, package manager, or CI. "Verifying a change" means: open the page in a browser (or `curl -sI http://127.0.0.1:8765/<page>.html`) and look at it.

## Architecture

### Page model
Each top-level `*.html` (`index`, `identity`, `color`, `typography`, `iconography`, `imagery`, `graphic-device`, `layout`, `voice`, `applications`, `downloads`, `contact`) is fully self-contained. The **floating dock nav (`<header class="nav">`) and footer (`<footer class="footer">`) are duplicated verbatim across every page** — there's no template engine. When you edit nav/footer markup, you must propagate the change to every page. [assets/partials.html](assets/partials.html) is a non-loaded reference file intended to hold the canonical markup; treat it as the source of truth and copy from it, but be aware existing pages may have drifted.

### Styles ([assets/css/styles.css](assets/css/styles.css))
One ~30KB stylesheet drives the whole site. Key conventions:
- **Design tokens are CSS custom properties on `:root`** — brand palette (`--qi-yellow`, `--qi-black`, `--qi-teal`, audience colors `--qi-male/female/kids/youth`, Spectrum aliases), surface system (`--bg`, `--ink`, `--line`), shadows, radii. Dark theme overrides live under `[data-theme="dark"]`. Prefer changing tokens over hard-coding hexes.
- **Legacy aliases are kept on purpose** (`--qi-bg`, `--qi-card`, `--qi-spark` → newer tokens). Don't delete them — older pages still reference them.
- Layout primitives: `.container`, `.section`, `.grid`/`.grid-2`/`.grid-3`, and a `.bento` 12-col system (`.b-3`, `.b-6`, `.b-9`, `.b-12`, plus `.r-2` row-span). Tile/card variants use `.bg-yellow`, `.bg-ink`, `.bg-teal`, `.bg-male`, etc.
- Animation: any element with `.reveal` is faded/slid in by the IntersectionObserver in `main.js` once it enters the viewport.

### Behavior ([assets/js/main.js](assets/js/main.js))
A single IIFE wires up everything via delegated `click`/`keydown` listeners on `document`. Hooks are **`data-*` attributes**, not classes:
- `data-theme-toggle` — flips `<html data-theme="dark">`, persisted in `localStorage` as `qi-theme`
- `data-menu-toggle` — toggles `.nav-links.open` for mobile
- `data-search-open` and the `.search-overlay` — opened by ⌘K / Ctrl+K, filters `.search-overlay .results a` by text content
- `data-copy="#HEX"` — copies the value to clipboard and shows a `.copy-toast`
- `.toc a[href^="#"]` — auto-highlights the active section via IntersectionObserver

When adding a new interaction, follow the same pattern (a `data-*` attribute + a delegated handler) so it works across every page without re-wiring per-page scripts.

### Content source
[qi-guidelines.txt](qi-guidelines.txt) is a `pdftotext -layout` dump of the official Qi brand guidelines PDF. The PNG snapshots in [assets/pdf-snapshots/](assets/pdf-snapshots/) are the matching `pdftoppm` page renders. Both are reference material for getting copy, color values, and layout cues correct on the HTML pages — they are not loaded by the site.
