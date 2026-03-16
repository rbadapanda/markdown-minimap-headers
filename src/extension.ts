import * as vscode from 'vscode';
import { parseHeaders } from './headerParser';
import { DecorationManager } from './decorationManager';
import { goToNextHeader, goToPreviousHeader } from './navigationCommands';

// Module-level so deactivate() and the config handler can both reach it
let activeManager: DecorationManager | undefined;

function getConfig() {
    return vscode.workspace.getConfiguration('markdownMinimapHeaders');
}

function isEnabled(): boolean {
    return getConfig().get('enabled', true);
}

function showScrollbar(): boolean {
    return getConfig().get('scrollbarDecorations', true);
}

function headerForeground(): string {
    return getConfig().get('headerForeground', '');
}

function updateDecorations(editor: vscode.TextEditor | undefined): void {
    if (!editor || editor.document.languageId !== 'markdown' || !activeManager) {
        return;
    }
    activeManager.update(editor, parseHeaders(editor.document));
}

export function activate(context: vscode.ExtensionContext): void {
    console.log('Markdown Minimap Headers is now active');

    if (isEnabled()) {
        activeManager = new DecorationManager(showScrollbar(), headerForeground());
        updateDecorations(vscode.window.activeTextEditor);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            updateDecorations(editor);
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                updateDecorations(editor);
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdownMinimapHeaders.goToNextHeader', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'markdown') {
                goToNextHeader(editor, parseHeaders(editor.document));
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdownMinimapHeaders.goToPreviousHeader', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'markdown') {
                goToPreviousHeader(editor, parseHeaders(editor.document));
            }
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (!e.affectsConfiguration('markdownMinimapHeaders')) {
                return;
            }
            // Any change to our namespace: recreate or destroy the manager
            activeManager?.dispose();
            activeManager = undefined;
            if (isEnabled()) {
                activeManager = new DecorationManager(showScrollbar(), headerForeground());
                updateDecorations(vscode.window.activeTextEditor);
            }
        }),
    );
}

export function deactivate(): void {
    activeManager?.dispose();
    activeManager = undefined;
}
