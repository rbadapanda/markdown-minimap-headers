# Markdown Minimap Headers

Makes markdown headers visible in the VSCode minimap — as text labels and colored blocks — so you can navigate large documents at a glance.

## Features

### Phase 1 — Text labels in the minimap
Header text (e.g. `## Getting Started`) appears as a readable label in the minimap, using VSCode's built-in folding region support. Requires `editor.minimap.showRegionSectionHeaders: true` (default).

### Phase 2 — Colored blocks at header positions
Each header level gets a distinct colored marker in the minimap overview ruler:

| Level | Dark theme | Light theme |
|-------|-----------|-------------|
| H1 | Gold — 100% opacity | Blue — 100% opacity |
| H2 | Gold — 70% | Blue — 70% |
| H3 | Gold — 40% | Blue — 40% |
| H4 | Gold — 20% | Blue — 20% |
| H5 | Gold — 10% | Blue — 10% |
| H6 | Gold — 5% | Blue — 5% |

Colors can be customized via `workbench.colorCustomizations` using the `minimapMarkdownHeaders.h1` – `minimapMarkdownHeaders.h6` color IDs.

### Phase 3 — Navigation commands
Jump between headers without leaving the keyboard:

| Command | Description |
|---------|-------------|
| **Markdown: Go to Next Markdown Header** | Move cursor to the next header below |
| **Markdown: Go to Previous Markdown Header** | Move cursor to the nearest header above |

Both commands are available in the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) when a markdown file is active. No wrap-around — stays put at the first/last header.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `markdownMinimapHeaders.enabled` | `true` | Enable/disable Phase 2 colored decorations. Navigation commands are always available. |

**Note:** Phase 1 text labels are driven by folding markers in `language-configuration.json` and cannot be toggled at runtime. Disabling `markdownMinimapHeaders.enabled` only removes the colored blocks.

## Requirements

- VSCode 1.88 or later

## Known Limitations

- **Phase 1 false positives**: The folding marker regex cannot distinguish headers inside fenced code blocks or YAML frontmatter. These may appear as labels in the minimap. Layers 2 and 3 correctly skip them.
- **Phase 1 and `.mdx`**: Works for any file VSCode identifies as `markdown` language.
