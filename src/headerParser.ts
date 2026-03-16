export interface ParsedHeader {
    line: number;   // 0-based line number
    level: number;  // 1–6
    text: string;   // header text without # prefix or trailing whitespace
}

// Narrow interface — compatible with vscode.TextDocument but mockable in tests
interface TextLines {
    readonly lineCount: number;
    lineAt(line: number): { readonly text: string };
}

const HEADER_RE = /^(#{1,6})\s+(.+)$/;
const FENCE_RE = /^(`{3,}|~{3,})/;

export function parseHeaders(document: TextLines): ParsedHeader[] {
    if (document.lineCount === 0) {
        return [];
    }

    const headers: ParsedHeader[] = [];
    let inFrontmatter = document.lineAt(0).text === '---';
    let inCodeBlock = false;

    for (let i = 0; i < document.lineCount; i++) {
        const text = document.lineAt(i).text;

        if (inFrontmatter) {
            // Line 0 opened frontmatter; close on the next '---'
            if (i > 0 && text === '---') {
                inFrontmatter = false;
            }
            continue;
        }

        if (FENCE_RE.test(text)) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        if (inCodeBlock) {
            continue;
        }

        const match = HEADER_RE.exec(text);
        if (match) {
            headers.push({ line: i, level: match[1].length, text: match[2].trim() });
        }
    }

    return headers;
}
