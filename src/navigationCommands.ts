import * as vscode from 'vscode';
import type { ParsedHeader } from './headerParser';

export function findNextHeaderLine(currentLine: number, headers: ParsedHeader[]): number | undefined {
    return headers.find(h => h.line > currentLine)?.line;
}

export function findPrevHeaderLine(currentLine: number, headers: ParsedHeader[]): number | undefined {
    let result: number | undefined;
    for (const h of headers) {
        if (h.line < currentLine) {
            result = h.line;
        }
    }
    return result;
}

function moveToLine(editor: vscode.TextEditor, line: number): void {
    const pos = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(
        new vscode.Range(pos, pos),
        vscode.TextEditorRevealType.InCenterIfOutsideViewport,
    );
}

export function goToNextHeader(editor: vscode.TextEditor, headers: ParsedHeader[]): void {
    const target = findNextHeaderLine(editor.selection.active.line, headers);
    if (target !== undefined) {
        moveToLine(editor, target);
    }
}

export function goToPreviousHeader(editor: vscode.TextEditor, headers: ParsedHeader[]): void {
    const target = findPrevHeaderLine(editor.selection.active.line, headers);
    if (target !== undefined) {
        moveToLine(editor, target);
    }
}
