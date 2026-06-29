# Aura Browser

Aura Browser is a desktop browser prototype with a soft neo-brutalist interface: crisp black outlines, candy-color accents, a compact power-user layout, and a Chromium engine underneath.

The project is intentionally built as a serious, GitHub-ready foundation rather than a throwaway mockup. Version 0.1 focuses on proving the product direction: a custom browser shell with tabs, bookmarks, notes, command actions, and a strong visual identity.

## Preview

> Screenshot coming after the first packaged build. The UI is already implemented in the Electron renderer and can be run locally with `npm run dev`.

## Features

- Chromium-powered browsing through Electron webviews
- Custom tab strip with colored active-tab accents
- Address bar with URL detection and DuckDuckGo search fallback
- Home surface with quick links and a branded search entry
- Bookmarks saved locally in browser storage
- Side notes panel for per-session browsing ideas
- Command palette with keyboard shortcuts
- Split workspace mode for a second lightweight surface
- Cute neo-brutalist design system with hard borders, offset shadows, and soft accent colors

## Tech Stack

- Electron for the desktop shell
- React for the browser UI
- TypeScript for app structure and safer iteration
- Vite and electron-vite for fast development builds
- Lucide React for interface icons

## Getting Started

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

For a Windows installer:

```bash
npm run dist
```

## Troubleshooting

If `npm run dev` fails with `Error: Electron uninstall`, the Electron package installed but its Windows binary did not finish downloading. Repair it with:

```bash
npm run repair:electron
npm run dev
```

## Project Structure

```text
src/main       Electron main process
src/preload    Safe bridge for runtime metadata
src/renderer   React browser interface
```

## Design Direction

Aura uses a "soft brutal" language:

- black outlines and offset shadows for confidence
- warm paper backgrounds instead of cold gray panels
- pink, mint, lemon, sky, coral, and lilac accents
- compact controls, icon-first buttons, and no ornamental clutter
- polished enough for a portfolio, playful enough to feel personal

## Roadmap

- Real persistent browsing sessions
- Download manager
- Per-site privacy controls
- Theme editor
- Pinned tabs and tab groups
- Better split-view tab handling
- Import/export bookmarks
- Signed installers and release automation

## Security Notes

Aura is currently a prototype. It uses Electron's `webview` tag to host pages inside the app while keeping the app UI separate from page content. Before using it as a daily browser, the project should add hardened permissions, stricter navigation policies, download handling, extension policy decisions, and a full security review.

## Contributing

This repository is designed to be easy to explore. Keep changes focused, prefer readable TypeScript, and preserve the visual system: clear borders, useful controls, and a UI that feels playful without becoming noisy.

## License

MIT
