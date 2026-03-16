import { describe, it, expect } from 'vitest';
import { parseHeaders } from './headerParser';

function doc(lines: string[]) {
    return {
        lineCount: lines.length,
        lineAt: (n: number) => ({ text: lines[n] }),
    };
}

describe('parseHeaders', () => {
    it('returns empty array for empty document', () => {
        expect(parseHeaders(doc([]))).toEqual([]);
    });

    it('returns empty array when no headers present', () => {
        expect(parseHeaders(doc(['just text', 'more text']))).toEqual([]);
    });

    it('parses H1 through H6', () => {
        const result = parseHeaders(doc([
            '# Heading One',
            '## Heading Two',
            '### Heading Three',
            '#### Heading Four',
            '##### Heading Five',
            '###### Heading Six',
        ]));
        expect(result).toEqual([
            { line: 0, level: 1, text: 'Heading One' },
            { line: 1, level: 2, text: 'Heading Two' },
            { line: 2, level: 3, text: 'Heading Three' },
            { line: 3, level: 4, text: 'Heading Four' },
            { line: 4, level: 5, text: 'Heading Five' },
            { line: 5, level: 6, text: 'Heading Six' },
        ]);
    });

    it('ignores lines with no space after #', () => {
        expect(parseHeaders(doc(['#NoSpace', '## Valid']))).toEqual([
            { line: 1, level: 2, text: 'Valid' },
        ]);
    });

    it('trims trailing whitespace from header text', () => {
        const result = parseHeaders(doc(['# Title   ']));
        expect(result[0].text).toBe('Title');
    });

    it('excludes headers inside backtick fenced code blocks', () => {
        const result = parseHeaders(doc([
            '# Real Header',
            '```',
            '# Fake Header in Code',
            '```',
            '## Another Real Header',
        ]));
        expect(result).toEqual([
            { line: 0, level: 1, text: 'Real Header' },
            { line: 4, level: 2, text: 'Another Real Header' },
        ]);
    });

    it('excludes headers inside tilde fenced code blocks', () => {
        const result = parseHeaders(doc([
            '# Real',
            '~~~',
            '# Fake',
            '~~~',
            '## Also Real',
        ]));
        expect(result).toEqual([
            { line: 0, level: 1, text: 'Real' },
            { line: 4, level: 2, text: 'Also Real' },
        ]);
    });

    it('handles long backtick fences (4+ backticks)', () => {
        const result = parseHeaders(doc([
            '````',
            '# Inside Long Fence',
            '````',
        ]));
        expect(result).toEqual([]);
    });

    it('treats unclosed code block as code to end of file', () => {
        const result = parseHeaders(doc([
            '# Before',
            '```',
            '# Inside unclosed',
            '# Still inside',
        ]));
        expect(result).toEqual([
            { line: 0, level: 1, text: 'Before' },
        ]);
    });

    it('excludes content in YAML frontmatter', () => {
        const result = parseHeaders(doc([
            '---',
            'title: My Doc',
            '# This looks like a header but is frontmatter',
            '---',
            '# Real Header',
        ]));
        expect(result).toEqual([
            { line: 4, level: 1, text: 'Real Header' },
        ]);
    });

    it('does not treat --- in the middle of document as frontmatter', () => {
        const result = parseHeaders(doc([
            '# First',
            '---',
            '# Second',
        ]));
        expect(result).toEqual([
            { line: 0, level: 1, text: 'First' },
            { line: 2, level: 1, text: 'Second' },
        ]);
    });

    it('handles mixed content: frontmatter, code blocks, and headers', () => {
        const result = parseHeaders(doc([
            '---',
            'title: My File',
            '---',
            '',
            '# Introduction',
            '',
            'Some text.',
            '',
            '```javascript',
            '# not a header',
            'const x = 1;',
            '```',
            '',
            '## Usage',
            '',
            '~~~',
            '# also not a header',
            '~~~',
            '',
            '### Details',
        ]));
        expect(result).toEqual([
            { line: 4, level: 1, text: 'Introduction' },
            { line: 13, level: 2, text: 'Usage' },
            { line: 19, level: 3, text: 'Details' },
        ]);
    });

    it('handles document with only frontmatter', () => {
        expect(parseHeaders(doc(['---', 'key: value', '---']))).toEqual([]);
    });

    it('handles unclosed frontmatter (no closing ---)', () => {
        // Everything treated as frontmatter
        const result = parseHeaders(doc([
            '---',
            '# In frontmatter',
        ]));
        expect(result).toEqual([]);
    });
});
