import * as vscode from 'vscode';
import type { ParsedHeader } from './headerParser';

export class DecorationManager implements vscode.Disposable {
    private readonly decorationTypes: Map<number, vscode.TextEditorDecorationType>;

    constructor(showScrollbar: boolean, headerForeground: string = '') {
        this.decorationTypes = new Map();
        const foreground = headerForeground.trim() || new vscode.ThemeColor('minimapMarkdownHeaders.headerForeground');
        for (let level = 1; level <= 6; level++) {
            this.decorationTypes.set(level, vscode.window.createTextEditorDecorationType({
                isWholeLine: true,
                color: foreground,
                backgroundColor: new vscode.ThemeColor(`minimapMarkdownHeaders.h${level}`),
                ...(showScrollbar ? {
                    overviewRulerColor: new vscode.ThemeColor(`minimapMarkdownHeaders.h${level}`),
                    overviewRulerLane: vscode.OverviewRulerLane.Left,
                } : {}),
            }));
        }
    }

    update(editor: vscode.TextEditor, headers: ParsedHeader[]): void {
        const byLevel = new Map<number, vscode.Range[]>();
        for (const header of headers) {
            const ranges = byLevel.get(header.level) ?? [];
            ranges.push(new vscode.Range(header.line, 0, header.line, 0));
            byLevel.set(header.level, ranges);
        }

        // Always set all 6 levels — passing [] clears stale decorations
        for (const [level, decorationType] of this.decorationTypes) {
            editor.setDecorations(decorationType, byLevel.get(level) ?? []);
        }
    }

    dispose(): void {
        for (const decorationType of this.decorationTypes.values()) {
            decorationType.dispose();
        }
        this.decorationTypes.clear();
    }
}
