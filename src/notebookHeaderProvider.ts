import { parseHeaders } from './headerParser';
import type { ParsedHeader } from './headerParser';
import type * as vscode from 'vscode';

export function parseNotebookHeaders(notebook: vscode.NotebookDocument): Map<number, ParsedHeader[]> {
    const headersByCell = new Map<number, ParsedHeader[]>();

    try {
        const cells = notebook.getCells();
        
        for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
            const cell = cells[cellIndex];

            // Only parse markdown cells (kind 1 = Markdown, 2 = Code)
            if (cell.kind !== 1) {
                continue;
            }

            const source = cell.document.getText();
            const lines = source.split('\n');
            const headers = parseHeaders({ 
                lineCount: lines.length, 
                lineAt: (line: number) => ({ text: lines[line] || '' }) 
            });

            if (headers.length > 0) {
                headersByCell.set(cellIndex, headers);
            }
        }
    } catch (error) {
        console.error('Error parsing notebook headers:', error);
    }

    return headersByCell;
}
