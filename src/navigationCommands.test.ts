import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('vscode', () => ({
    Selection: vi.fn((anchor: unknown, active: unknown) => ({ anchor, active })),
    Position: vi.fn((line: number, char: number) => ({ line, char })),
    Range: vi.fn((start: unknown, end: unknown) => ({ start, end })),
    TextEditorRevealType: { InCenterIfOutsideViewport: 2 },
}));

import { findNextHeaderLine, findPrevHeaderLine, goToNextHeader, goToPreviousHeader } from './navigationCommands';
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

    it('does nothing when there is no next header', () => {
        const editor = makeEditor(20);
        goToNextHeader(editor, headers);

        expect(vscode.Position).not.toHaveBeenCalled();
        expect(vi.mocked(editor.revealRange)).not.toHaveBeenCalled();
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

    it('does nothing when there is no previous header', () => {
        const editor = makeEditor(0);
        goToPreviousHeader(editor, headers);

        expect(vscode.Position).not.toHaveBeenCalled();
        expect(vi.mocked(editor.revealRange)).not.toHaveBeenCalled();
    });
});
