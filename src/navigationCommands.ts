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

export function goToNextHeader(editor: vscode.TextEditor, headers: ParsedHeader[]): boolean {
    const target = findNextHeaderLine(editor.selection.active.line, headers);
    if (target !== undefined) {
        moveToLine(editor, target);
        return true;
    }
    return false;
}

export function goToPreviousHeader(editor: vscode.TextEditor, headers: ParsedHeader[]): boolean {
    const target = findPrevHeaderLine(editor.selection.active.line, headers);
    if (target !== undefined) {
        moveToLine(editor, target);
        return true;
    }
    return false;
}

export function goToNextHeaderInNotebook(
    notebook: vscode.NotebookDocument,
    headersByCell: Map<number, ParsedHeader[]>,
): void {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
        return;
    }

    const cells = notebook.getCells();
    let currentCellIndex = -1;
    let hasEditFocus = false;

    // Prefer the active text editor (cell in edit mode) to identify current cell
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].document === activeEditor.document) {
                currentCellIndex = i;
                hasEditFocus = true;
                break;
            }
        }
    }

    // Fallback: use the notebook's selected cell (command mode — no edit focus)
    if (currentCellIndex === -1 && notebookEditor.selections.length > 0) {
        currentCellIndex = notebookEditor.selections[0].start;
    }

    // Edit mode: start from next cell (current cell already searched by goToNextHeader).
    // Command mode / no focus: start from current cell inclusive so its headers aren't skipped.
    const startIndex = hasEditFocus ? currentCellIndex + 1 : Math.max(0, currentCellIndex);

    // Move to the first header in the next cell that has headers
    for (let i = startIndex; i < cells.length; i++) {
        const headers = headersByCell.get(i);
        if (headers && headers.length > 0) {
            const firstHeader = headers[0];
            vscode.window.showTextDocument(cells[i].document, {
                viewColumn: vscode.ViewColumn.Active,
                preserveFocus: false,
                selection: new vscode.Range(firstHeader.line, 0, firstHeader.line, 0),
            });
            return;
        }
    }
}

export function goToPreviousHeaderInNotebook(
    notebook: vscode.NotebookDocument,
    headersByCell: Map<number, ParsedHeader[]>,
): void {
    const notebookEditor = vscode.window.activeNotebookEditor;
    if (!notebookEditor) {
        return;
    }

    const cells = notebook.getCells();
    let currentCellIndex = -1;
    let hasEditFocus = false;

    // Prefer the active text editor (cell in edit mode) to identify current cell
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        for (let i = 0; i < cells.length; i++) {
            if (cells[i].document === activeEditor.document) {
                currentCellIndex = i;
                hasEditFocus = true;
                break;
            }
        }
    }

    // Fallback: use the notebook's selected cell (command mode — no edit focus)
    if (currentCellIndex === -1 && notebookEditor.selections.length > 0) {
        currentCellIndex = notebookEditor.selections[0].start;
    }

    // No selection at all: start from the last cell
    if (currentCellIndex === -1) {
        currentCellIndex = cells.length - 1;
    }

    // Edit mode: start from previous cell (current cell already searched by goToPreviousHeader).
    // Command mode / no focus: start from current cell inclusive so its headers aren't skipped.
    const startIndex = hasEditFocus ? currentCellIndex - 1 : currentCellIndex;

    // Move to the last header in the previous cell that has headers
    for (let i = startIndex; i >= 0; i--) {
        const headers = headersByCell.get(i);
        if (headers && headers.length > 0) {
            const lastHeader = headers[headers.length - 1];
            vscode.window.showTextDocument(cells[i].document, {
                viewColumn: vscode.ViewColumn.Active,
                preserveFocus: false,
                selection: new vscode.Range(lastHeader.line, 0, lastHeader.line, 0),
            });
            return;
        }
    }
}
