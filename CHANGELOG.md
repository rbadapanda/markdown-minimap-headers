# Changelog

All notable changes to this project will be documented in this file.

## [0.1.8] — 2026-03-17

### Added
- Support for MDX (`.mdx`) files
- Support for Markdoc (`.markdoc`) files
- Updated documentation to reflect new supported file types

## [0.1.0] — 2026-03-14

### Added
- **Phase 1**: Markdown headers appear as text labels in the minimap via folding region markers (zero runtime code; uses `language-configuration.json`)
- **Phase 2**: Colored overview ruler blocks at each header line, with a steep alpha gradient (H1 full opacity → H6 near-transparent) for visual hierarchy; theme-aware colors (gold in dark themes, blue in light themes)
- **Phase 3**: `Markdown: Go to Next Markdown Header` and `Markdown: Go to Previous Markdown Header` commands for keyboard-driven document navigation
- `markdownMinimapHeaders.enabled` setting to toggle Phase 2 decorations on/off at runtime
- Six theme color contribution points (`minimapMarkdownHeaders.h1` – `minimapMarkdownHeaders.h6`) for user customization
