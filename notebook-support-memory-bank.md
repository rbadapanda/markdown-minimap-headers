# Notebook Support Memory Bank

## Summary
Analysis of adding Python notebook (.ipynb) support to the Markdown Minimap Headers extension. Explored technical feasibility, VSCode notebook API constraints, and implementation strategy. Key finding: scrollbar markers are possible, but minimap header labels are not due to VSCode API limitations.

## Tasks

### Phase 1: Scrollbar Markers MVP
- [ ] Add `vscode.notebook.onDidChangeNotebookDocument` listener in `extension.ts`
- [ ] Create `notebookHeaderProvider.ts` to parse notebook markdown cells
- [ ] Extend `decorationManager.ts` to accept notebook cell editors
- [ ] Apply scrollbar decorations to headers in notebook cells
- [ ] Update `package.json` to activate extension for `.ipynb` files
- [ ] Test with Jupyter and Quarto notebooks

### Phase 2: Navigation Commands (Optional)
- [ ] Add notebook-specific navigation commands (`goToNextHeaderInNotebook`, etc.)
- [ ] Use `vscode.notebook.activeNotebookEditor` to jump between markdown cells with headers
- [ ] Separate from markdown commands to avoid confusion

### Phase 3: Documentation & Polish
- [ ] Update README with notebook limitations (no minimap labels, scrollbar only)
- [ ] Add configuration option to enable/disable notebook support
- [ ] Document expected behavior vs markdown files

## Key Technical Findings

### What Works
- **Scrollbar markers**: Overview ruler decorations work in notebook cells
- **Header detection**: Existing regex parser is reusable; just parse markdown cell content
- **Cell filtering**: Notebook cell type is explicit metadata — no ambiguity between headers and code comments
- **No new dependencies**: All needed APIs already available

### What Doesn't Work
- **Minimap labels**: Folding region API (`registerFoldingRangeProvider`) only works on TextDocument, not notebook cells
- **Cross-cell decorations**: Decorations are scoped to individual cells

### Architecture Changes Needed
1. New event listener: `vscode.notebook.onDidChangeNotebookDocument`
2. New provider: `notebookHeaderProvider.ts` to parse markdown cells
3. Extended decoration manager: Handle both TextEditor and NotebookCellTextEditor
4. Separate navigation commands for notebooks

## Implementation Strategy

**Minimal Viable Path:**
1. Listen to notebook document changes
2. Parse markdown cells only (filter by `cell_type === "markdown"`)
3. Apply scrollbar decorations (overview ruler) to header lines
4. Skip minimap labels — document as limitation
5. Reuse 90% of existing logic

**Effort**: Medium (not a rewrite, but requires new event handling paths)

**Feature Trade-off**: Users get scrollbar hierarchy visualization but lose readable minimap labels. This is acceptable for notebooks since minimap is less useful with cell boundaries.

## Risk Factors

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Users expect minimap labels like markdown | High | Document clearly; set expectations upfront |
| Notebook API changes in future VSCode | Medium | Pin minimum VSCode version (1.88+) |
| Performance with large notebooks | Medium | Debounce parsing, cache results |
| Inconsistent rendering across notebook types | Medium | Test with Jupyter, Quarto, etc. |
| User confusion between markdown/notebook features | Low | Separate commands, clear docs |

## Execution History

- **2026-03-17**: Initial analysis completed. Explored 5 dimensions: notebook structure, VSCode API compatibility, implementation scope, edge cases, feasibility. Determined scrollbar-only approach is viable MVP.

## Changelog

- Analyzed .ipynb JSON structure and header detection strategy
- Identified VSCode folding region API limitation (TextDocument only)
- Confirmed scrollbar decorations work in notebook cells
- Designed minimal viable implementation (scrollbar markers, no minimap labels)
- Created Phase 1 (MVP), Phase 2 (navigation), Phase 3 (docs) checklist
- Documented 6 risk factors and mitigations
