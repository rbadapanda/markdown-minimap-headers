# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — 2026-03-18

First stable release. Markdown structure navigation for regular files and Jupyter Notebooks.

### Highlights
- **Jupyter Notebook support** — colored header highlights and cross-cell keyboard navigation for `.ipynb` files
- **Broad markdown format coverage** — Quarto, R Markdown, MDX, and Markdoc alongside standard markdown
- **Four navigation commands** — next/previous header in files and notebooks, with automatic cross-cell fallthrough

### Added
- Jupyter Notebook support (`.ipynb`) — colored background highlights for markdown headers in notebook cells
- Cross-cell keyboard navigation — `Go to Next Header in Notebook` and `Go to Previous Header in Notebook` commands
- Regular next/previous header commands automatically fall through to adjacent notebook cells
- Support for Quarto (`.qmd`), R Markdown (`.rmd`), MDX (`.mdx`), and Markdoc (`.markdoc`) files
- Extension icon and marketplace assets
- Screenshot images and GIF demos in README

---

## [0.1.9] — 2026-03-18

### Added
- Jupyter Notebook support (`.ipynb`) — colored background highlights for markdown headers in notebook cells
- Cross-cell keyboard navigation — `Go to Next Header in Notebook` and `Go to Previous Header in Notebook` commands
- Regular next/previous header commands automatically fall through to adjacent notebook cells when no more headers exist in the current cell
- Notebook header parser (`notebookHeaderProvider.ts`) for extracting headers from markdown cells
- VSCode debug launch configuration (F5 starts extension host)

## [0.1.8] — 2026-03-17

### Added
- Support for MDX (`.mdx`) files
- Support for Markdoc (`.markdoc`) files
- Updated documentation to reflect new supported file types

## [0.1.7] — 2026-03-16

### Added
- Support for Quarto (`.qmd`) files
- Support for R Markdown (`.rmd`) files

## [0.1.6] — 2026-03-16

### Added
- Extension icon for marketplace listing
- Bundled local images into the extension package

## [0.1.5] — 2026-03-16

### Added
- Screenshot images (GIF demos, settings screenshot) in README overview section

### Changed
- Renamed `scrollbarDecorations` setting to `turnOffScrollbarDecorations` for clarity

## [0.1.4] — 2026-03-16

### Changed
- Clarified `enabled` and `scrollbarDecorations` setting descriptions in package.json

## [0.1.3] — 2026-03-15

### Fixed
- Bumped Node to 20 for `vsce publish` compatibility in CI

## [0.1.2] — 2026-03-15

### Fixed
- Resolved DecorationManager test failures

## [0.1.1] — 2026-03-15

### Changed
- Updated extension description and added releasing section to README

## [0.1.0] — 2026-03-15

### Added
- **Phase 1**: Markdown headers appear as text labels in the minimap via folding region markers (zero runtime code; uses `language-configuration.json`)
- **Phase 2**: Colored overview ruler blocks at each header line, with a steep alpha gradient (H1 full opacity → H6 near-transparent) for visual hierarchy; theme-aware colors (gold in dark themes, blue in light themes)
- **Phase 3**: `Markdown: Go to Next Markdown Header` and `Markdown: Go to Previous Markdown Header` commands for keyboard-driven document navigation
- `markdownMinimapHeaders.enabled` setting to toggle Phase 2 decorations on/off at runtime
- Six theme color contribution points (`minimapMarkdownHeaders.h1` – `minimapMarkdownHeaders.h6`) for user customization
