import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('vscode', () => ({
    window: {
        createTextEditorDecorationType: vi.fn(() => ({ dispose: vi.fn() })),
    },
    ThemeColor: vi.fn((id: string) => ({ id })),
    OverviewRulerLane: { Full: 7 },
    Range: vi.fn((startLine: number, startChar: number) => ({ startLine, startChar })),
}));

import * as vscode from 'vscode';
import { DecorationManager } from './decorationManager';
import type { ParsedHeader } from './headerParser';

function makeEditor() {
    return { setDecorations: vi.fn() } as unknown as vscode.TextEditor;
}

describe('DecorationManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('creates exactly 6 decoration types on construction', () => {
        new DecorationManager(true);
        expect(vscode.window.createTextEditorDecorationType).toHaveBeenCalledTimes(6);
    });

    it('creates decoration types with backgroundColor for minimap (h1Background–h6Background)', () => {
        new DecorationManager(true);
        const calls = vi.mocked(vscode.window.createTextEditorDecorationType).mock.calls;
        const bgIds = calls.map(([opts]) => (opts.backgroundColor as { id: string }).id);
        expect(bgIds).toEqual([
            'minimapMarkdownHeaders.h1Background',
            'minimapMarkdownHeaders.h2Background',
            'minimapMarkdownHeaders.h3Background',
            'minimapMarkdownHeaders.h4Background',
            'minimapMarkdownHeaders.h5Background',
            'minimapMarkdownHeaders.h6Background',
        ]);
    });

    it('includes overviewRulerColor for scrollbar when showScrollbar is true', () => {
        new DecorationManager(true);
        const calls = vi.mocked(vscode.window.createTextEditorDecorationType).mock.calls;
        const rulerIds = calls.map(([opts]) => (opts.overviewRulerColor as { id: string } | undefined)?.id);
        expect(rulerIds).toEqual([
            'minimapMarkdownHeaders.h1',
            'minimapMarkdownHeaders.h2',
            'minimapMarkdownHeaders.h3',
            'minimapMarkdownHeaders.h4',
            'minimapMarkdownHeaders.h5',
            'minimapMarkdownHeaders.h6',
        ]);
    });

    it('omits overviewRulerColor when showScrollbar is false', () => {
        new DecorationManager(false);
        const calls = vi.mocked(vscode.window.createTextEditorDecorationType).mock.calls;
        for (const [opts] of calls) {
            expect(opts.overviewRulerColor).toBeUndefined();
            expect(opts.overviewRulerLane).toBeUndefined();
        }
    });

    it('calls setDecorations for all 6 levels on every update', () => {
        const manager = new DecorationManager(true);
        const editor = makeEditor();
        const headers: ParsedHeader[] = [{ line: 0, level: 1, text: 'H1' }];
        manager.update(editor, headers);
        expect(vi.mocked(editor.setDecorations)).toHaveBeenCalledTimes(6);
    });

    it('passes a Range for headers that are present', () => {
        const manager = new DecorationManager(true);
        const editor = makeEditor();
        const headers: ParsedHeader[] = [
            { line: 2, level: 1, text: 'Intro' },
            { line: 7, level: 2, text: 'Body' },
        ];
        manager.update(editor, headers);

        const calls = vi.mocked(editor.setDecorations).mock.calls;
        const decorationTypeH1 = vi.mocked(vscode.window.createTextEditorDecorationType).mock.results[0].value;
        const h1Call = calls.find(([type]) => type === decorationTypeH1);
        expect(h1Call?.[1]).toHaveLength(1);
    });

    it('passes empty array for levels with no headers, clearing stale decorations', () => {
        const manager = new DecorationManager(true);
        const editor = makeEditor();
        const headers: ParsedHeader[] = [{ line: 0, level: 1, text: 'Only H1' }];
        manager.update(editor, headers);

        const calls = vi.mocked(editor.setDecorations).mock.calls;
        const emptyCalls = calls.filter(([, ranges]) => (ranges as unknown[]).length === 0);
        expect(emptyCalls).toHaveLength(5); // H2–H6 get empty arrays
    });

    it('handles multiple headers at the same level', () => {
        const manager = new DecorationManager(true);
        const editor = makeEditor();
        const headers: ParsedHeader[] = [
            { line: 1, level: 2, text: 'A' },
            { line: 5, level: 2, text: 'B' },
            { line: 9, level: 2, text: 'C' },
        ];
        manager.update(editor, headers);

        const calls = vi.mocked(editor.setDecorations).mock.calls;
        const decorationTypeH2 = vi.mocked(vscode.window.createTextEditorDecorationType).mock.results[1].value;
        const h2Call = calls.find(([type]) => type === decorationTypeH2);
        expect(h2Call?.[1]).toHaveLength(3);
    });

    it('handles empty headers array (clears all levels)', () => {
        const manager = new DecorationManager(true);
        const editor = makeEditor();
        manager.update(editor, []);

        const calls = vi.mocked(editor.setDecorations).mock.calls;
        const emptyCalls = calls.filter(([, ranges]) => (ranges as unknown[]).length === 0);
        expect(emptyCalls).toHaveLength(6);
    });

    it('disposes all 6 decoration types', () => {
        const manager = new DecorationManager(true);
        const created = vi.mocked(vscode.window.createTextEditorDecorationType).mock.results;
        manager.dispose();
        for (const result of created) {
            expect(result.value.dispose).toHaveBeenCalledOnce();
        }
    });
});
