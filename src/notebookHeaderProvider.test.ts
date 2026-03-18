import { describe, it, expect } from 'vitest';
import { parseNotebookHeaders } from './notebookHeaderProvider';

describe('parseNotebookHeaders', () => {
    it('parses headers from markdown cells only', () => {
        const notebook = {
            getCells: () => [
                {
                    kind: 1, // Markdown
                    index: 0,
                    document: { getText: () => '# Main Title\nSome content' },
                },
                {
                    kind: 2, // Code
                    index: 1,
                    document: { getText: () => '# This is a comment\nprint("hello")' },
                },
                {
                    kind: 1, // Markdown
                    index: 2,
                    document: { getText: () => '## Section\nMore content' },
                },
            ],
        };

        const headers = parseNotebookHeaders(notebook as any);

        expect(headers.size).toBe(2);
        expect(headers.get(0)).toEqual([{ line: 0, level: 1, text: 'Main Title' }]);
        expect(headers.get(2)).toEqual([{ line: 0, level: 2, text: 'Section' }]);
    });

    it('skips code cells entirely', () => {
        const notebook = {
            getCells: () => [
                {
                    kind: 2, // Code
                    index: 0,
                    document: { getText: () => '# Comment\n## Another comment' },
                },
            ],
        };

        const headers = parseNotebookHeaders(notebook as any);

        expect(headers.size).toBe(0);
    });

    it('returns empty map for notebook with no headers', () => {
        const notebook = {
            getCells: () => [
                {
                    kind: 1, // Markdown
                    index: 0,
                    document: { getText: () => 'Just text\nNo headers here' },
                },
            ],
        };

        const headers = parseNotebookHeaders(notebook as any);

        expect(headers.size).toBe(0);
    });

    it('handles multiple headers in single markdown cell', () => {
        const notebook = {
            getCells: () => [
                {
                    kind: 1, // Markdown
                    index: 0,
                    document: { getText: () => '# Title\n## Subsection\n### Sub-subsection' },
                },
            ],
        };

        const headers = parseNotebookHeaders(notebook as any);

        expect(headers.size).toBe(1);
        expect(headers.get(0)).toHaveLength(3);
        expect(headers.get(0)?.[0]).toEqual({ line: 0, level: 1, text: 'Title' });
        expect(headers.get(0)?.[1]).toEqual({ line: 1, level: 2, text: 'Subsection' });
        expect(headers.get(0)?.[2]).toEqual({ line: 2, level: 3, text: 'Sub-subsection' });
    });

    it('handles empty cells gracefully', () => {
        const notebook = {
            getCells: () => [
                {
                    kind: 1, // Markdown
                    index: 0,
                    document: { getText: () => '' },
                },
            ],
        };

        const headers = parseNotebookHeaders(notebook as any);

        expect(headers.size).toBe(0);
    });
});
