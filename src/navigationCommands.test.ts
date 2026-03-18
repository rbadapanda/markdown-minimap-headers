import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockWindow = vi.hoisted(() => ({
    activeTextEditor: null as unknown,
    activeNotebookEditor: null as unknown,
    showTextDocument: vi.fn(),
}));

vi.mock('vscode', () => ({
    Selection: vi.fn((anchor: unknown, active: unknown) => ({ anchor, active })),
    Position: vi.fn((line: number, char: number) => ({ line, char })),
    Range: vi.fn((start: unknown, end: unknown) => ({ start, end })),
    TextEditorRevealType: { InCenterIfOutsideViewport: 2 },
    ViewColumn: { Active: 1 },
    window: mockWindow,
}));

import { findNextHeaderLine, findPrevHeaderLine, goToNextHeader, goToPreviousHeader, goToNextHeaderInNotebook, goToPreviousHeaderInNotebook } from './navigationCommands';
import type { ParsedHeader } from './headerParser';
import * as vscode from 'vscode';

// ─── Pure finder tests (no vscode mock needed) ───────────────────────────────

const headers: ParsedHeader[] = [
    { line: 2, level: 1, text: 'Intro' },
    { line: 7, level: 2, text: 'Body' },
    { line: 15, level: 1, text: 'Conclusion' },
];

describe('findNextHeaderLine', () => {
    it('returns first header when cursor is before all headers', () => {
        expect(findNextHeaderLine(0, headers)).toBe(2);
    });

    it('returns next header when cursor is on a header line', () => {
        expect(findNextHeaderLine(2, headers)).toBe(7);
    });

    it('returns next header when cursor is between headers', () => {
        expect(findNextHeaderLine(5, headers)).toBe(7);
    });

    it('returns undefined when cursor is on the last header', () => {
        expect(findNextHeaderLine(15, headers)).toBeUndefined();
    });

    it('returns undefined when cursor is after all headers', () => {
        expect(findNextHeaderLine(20, headers)).toBeUndefined();
    });

    it('returns undefined for empty headers array', () => {
        expect(findNextHeaderLine(0, [])).toBeUndefined();
    });
});

describe('findPrevHeaderLine', () => {
    it('returns last header when cursor is after all headers', () => {
        expect(findPrevHeaderLine(20, headers)).toBe(15);
    });

    it('returns previous header when cursor is on a header line', () => {
        expect(findPrevHeaderLine(7, headers)).toBe(2);
    });

    it('returns previous header when cursor is between headers', () => {
        expect(findPrevHeaderLine(10, headers)).toBe(7);
    });

    it('returns undefined when cursor is on the first header', () => {
        expect(findPrevHeaderLine(2, headers)).toBeUndefined();
    });

    it('returns undefined when cursor is before all headers', () => {
        expect(findPrevHeaderLine(0, headers)).toBeUndefined();
    });

    it('returns undefined for empty headers array', () => {
        expect(findPrevHeaderLine(0, [])).toBeUndefined();
    });
});

// ─── VSCode wrapper tests ─────────────────────────────────────────────────────

function makeEditor(cursorLine: number) {
    return {
        selection: { active: { line: cursorLine } },
        revealRange: vi.fn(),
    } as unknown as vscode.TextEditor;
}

describe('goToNextHeader', () => {
    beforeEach(() => vi.clearAllMocks());

    it('moves cursor to the next header and reveals it', () => {
        const editor = makeEditor(0);
        goToNextHeader(editor, headers);

        expect(vscode.Position).toHaveBeenCalledWith(2, 0);
        expect(vi.mocked(editor.revealRange)).toHaveBeenCalledOnce();
    });

    it('returns true when a next header is found', () => {
        const editor = makeEditor(0);
        expect(goToNextHeader(editor, headers)).toBe(true);
    });

    it('does nothing when there is no next header', () => {
        const editor = makeEditor(20);
        goToNextHeader(editor, headers);

        expect(vscode.Position).not.toHaveBeenCalled();
        expect(vi.mocked(editor.revealRange)).not.toHaveBeenCalled();
    });

    it('returns false when there is no next header (signals fallback needed)', () => {
        const editor = makeEditor(20);
        expect(goToNextHeader(editor, headers)).toBe(false);
    });
});

describe('goToPreviousHeader', () => {
    beforeEach(() => vi.clearAllMocks());

    it('moves cursor to the previous header and reveals it', () => {
        const editor = makeEditor(20);
        goToPreviousHeader(editor, headers);

        expect(vscode.Position).toHaveBeenCalledWith(15, 0);
        expect(vi.mocked(editor.revealRange)).toHaveBeenCalledOnce();
    });

    it('returns true when a previous header is found', () => {
        const editor = makeEditor(20);
        expect(goToPreviousHeader(editor, headers)).toBe(true);
    });

    it('does nothing when there is no previous header', () => {
        const editor = makeEditor(0);
        goToPreviousHeader(editor, headers);

        expect(vscode.Position).not.toHaveBeenCalled();
        expect(vi.mocked(editor.revealRange)).not.toHaveBeenCalled();
    });

    it('returns false when there is no previous header (signals fallback needed)', () => {
        const editor = makeEditor(0);
        expect(goToPreviousHeader(editor, headers)).toBe(false);
    });
});

// ─── Notebook navigation tests ────────────────────────────────────────────────

function makeCell(index: number) {
    return { document: { cellIndex: index }, index, kind: 1 };
}

describe('goToNextHeaderInNotebook', () => {
    const h1: ParsedHeader = { line: 3, level: 1, text: 'Alpha' };
    const h2: ParsedHeader = { line: 5, level: 2, text: 'Beta' };

    let cells: ReturnType<typeof makeCell>[];
    let notebook: { getCells: () => typeof cells };

    beforeEach(() => {
        cells = [makeCell(0), makeCell(1), makeCell(2)];
        notebook = { getCells: () => cells };
        mockWindow.showTextDocument.mockReset();
        mockWindow.activeNotebookEditor = { selections: [] };
        mockWindow.activeTextEditor = null;
    });

    // --- command mode (no edit focus) ---

    it('command mode: includes the selected cell in the search (does not skip it)', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 0 }] };
        const headersByCell = new Map([[0, [h1]], [2, [h2]]]);

        goToNextHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(
            cells[0].document,
            expect.objectContaining({ preserveFocus: false }),
        );
    });

    it('command mode: skips cells without headers and finds the next one forward', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 1 }] };
        const headersByCell = new Map([[0, [h1]], [2, [h2]]]);

        goToNextHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(
            cells[2].document,
            expect.any(Object),
        );
    });

    it('command mode: no selection — starts from cell 0', () => {
        mockWindow.activeNotebookEditor = { selections: [] };
        const headersByCell = new Map([[2, [h2]]]);

        goToNextHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(cells[2].document, expect.any(Object));
    });

    it('command mode: does nothing when no headers exist at or after the selection', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 2 }] };
        const headersByCell = new Map([[0, [h1]]]); // headers only before selection

        goToNextHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).not.toHaveBeenCalled();
    });

    // --- edit mode (cell has text cursor) ---

    it('edit mode: skips the focused cell and jumps to the next cell with headers', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 0 }] };
        mockWindow.activeTextEditor = { document: cells[0].document }; // cell 0 in edit mode
        const headersByCell = new Map([[0, [h1]], [2, [h2]]]);

        goToNextHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(cells[2].document, expect.any(Object));
    });

    it('edit mode: does nothing when no headers exist in cells after the focused one', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 0 }] };
        mockWindow.activeTextEditor = { document: cells[0].document };
        const headersByCell = new Map([[0, [h1]]]); // headers only in focused cell

        goToNextHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).not.toHaveBeenCalled();
    });
});

describe('goToPreviousHeaderInNotebook', () => {
    const h1: ParsedHeader = { line: 3, level: 1, text: 'Alpha' };
    const h2: ParsedHeader = { line: 5, level: 2, text: 'Beta' };

    let cells: ReturnType<typeof makeCell>[];
    let notebook: { getCells: () => typeof cells };

    beforeEach(() => {
        cells = [makeCell(0), makeCell(1), makeCell(2)];
        notebook = { getCells: () => cells };
        mockWindow.showTextDocument.mockReset();
        mockWindow.activeNotebookEditor = { selections: [] };
        mockWindow.activeTextEditor = null;
    });

    // --- command mode ---

    it('command mode: includes the selected cell in the search (does not skip it)', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 2 }] };
        const headersByCell = new Map([[0, [h1]], [2, [h2]]]);

        goToPreviousHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(
            cells[2].document,
            expect.objectContaining({ preserveFocus: false }),
        );
    });

    it('command mode: skips cells without headers and finds the previous one', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 1 }] };
        const headersByCell = new Map([[0, [h1]], [2, [h2]]]);

        goToPreviousHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(cells[0].document, expect.any(Object));
    });

    it('command mode: no selection — starts from the last cell', () => {
        mockWindow.activeNotebookEditor = { selections: [] };
        const headersByCell = new Map([[0, [h1]]]);

        goToPreviousHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(cells[0].document, expect.any(Object));
    });

    it('command mode: does nothing when no headers exist at or before the selection', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 0 }] };
        const headersByCell = new Map([[2, [h2]]]); // headers only after selection

        goToPreviousHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).not.toHaveBeenCalled();
    });

    // --- edit mode ---

    it('edit mode: skips the focused cell and jumps to the previous cell with headers', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 2 }] };
        mockWindow.activeTextEditor = { document: cells[2].document }; // cell 2 in edit mode
        const headersByCell = new Map([[0, [h1]], [2, [h2]]]);

        goToPreviousHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).toHaveBeenCalledWith(cells[0].document, expect.any(Object));
    });

    it('edit mode: does nothing when no headers exist in cells before the focused one', () => {
        mockWindow.activeNotebookEditor = { selections: [{ start: 2 }] };
        mockWindow.activeTextEditor = { document: cells[2].document };
        const headersByCell = new Map([[2, [h2]]]); // headers only in focused cell

        goToPreviousHeaderInNotebook(notebook as never, headersByCell);

        expect(mockWindow.showTextDocument).not.toHaveBeenCalled();
    });
});
