import * as vscode from 'vscode';
import { parseHeaders } from './headerParser';
import { DecorationManager } from './decorationManager';
import { goToNextHeader, goToPreviousHeader, goToNextHeaderInNotebook, goToPreviousHeaderInNotebook } from './navigationCommands';
import { parseNotebookHeaders } from './notebookHeaderProvider';

// Module-level so deactivate() and the config handler can both reach it
let activeManager: DecorationManager | undefined;
let notebookManager: DecorationManager | undefined;
let outputChannel: vscode.OutputChannel;

const SUPPORTED_LANGUAGES = new Set(['markdown', 'quarto', 'rmd', 'mdx', 'markdoc']);

function getConfig() {
    return vscode.workspace.getConfiguration('markdownMinimapHeaders');
}

function isEnabled(): boolean {
    return getConfig().get('enabled', true);
}

function turnOffScrollbar(): boolean {
    return getConfig().get('turnOffScrollbarDecorations', false);
}

function headerForeground(): string {
    return getConfig().get('headerForeground', '');
}

function updateDecorations(editor: vscode.TextEditor | undefined): void {
    if (!editor || !SUPPORTED_LANGUAGES.has(editor.document.languageId) || !activeManager) {
        return;
    }
    activeManager.update(editor, parseHeaders(editor.document));
}

function updateNotebookDecorations(notebook: vscode.NotebookDocument): void {
    if (!notebookManager) {
        return;
    }

    try {
        const headersByCell = parseNotebookHeaders(notebook);

        // Apply decorations to all visible cell editors
        for (const editor of vscode.window.visibleTextEditors) {
            const notebookCell = notebook.getCells().find(cell => cell.document === editor.document);
            if (!notebookCell) {
                continue;
            }

            const headers = headersByCell.get(notebookCell.index);
            
            if (headers && headers.length > 0) {
                notebookManager.update(editor, headers);
            }
        }
    } catch (error) {
        outputChannel.appendLine(`Error updating notebook decorations: ${error}`);
    }
}

export function activate(context: vscode.ExtensionContext): void {
    try {
        outputChannel = vscode.window.createOutputChannel('Markdown Minimap Headers');

        if (isEnabled()) {
            activeManager = new DecorationManager(!turnOffScrollbar(), headerForeground());
            notebookManager = new DecorationManager(!turnOffScrollbar(), headerForeground());
            updateDecorations(vscode.window.activeTextEditor);

            // Update decorations for active notebook
            if (vscode.window.activeNotebookEditor) {
                updateNotebookDecorations(vscode.window.activeNotebookEditor.notebook);
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Markdown Minimap Headers activation failed: ${error}`);
        throw error;
    }

    context.subscriptions.push(
        vscode.window.onDidChangeVisibleTextEditors(editors => {
            // Apply decorations to notebook cells as they become visible
            if (vscode.window.activeNotebookEditor) {
                const notebook = vscode.window.activeNotebookEditor.notebook;
                for (const editor of editors) {
                    const cell = notebook.getCells().find(c => c.document === editor.document);
                    if (cell) {
                        updateNotebookDecorations(notebook);
                        break;
                    }
                }
            }
        }),
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            updateDecorations(editor);
            
            // Check if this editor is a notebook cell
            if (editor && vscode.window.activeNotebookEditor) {
                const notebook = vscode.window.activeNotebookEditor.notebook;
                const cell = notebook.getCells().find(c => c.document === editor.document);
                if (cell) {
                    updateNotebookDecorations(notebook);
                }
            }
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
        vscode.workspace.onDidChangeNotebookDocument((event: vscode.NotebookDocumentChangeEvent) => {
            updateNotebookDecorations(event.notebook);
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenNotebookDocument((notebook: vscode.NotebookDocument) => {
            updateNotebookDecorations(notebook);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdownMinimapHeaders.goToNextHeader', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
                // No focused cell — if a notebook is open, navigate from the beginning
                const notebook = vscode.window.activeNotebookEditor?.notebook;
                if (notebook) {
                    const headersByCell = parseNotebookHeaders(notebook);
                    goToNextHeaderInNotebook(notebook, headersByCell);
                }
                return;
            }
            const found = goToNextHeader(editor, parseHeaders(editor.document));
            if (!found) {
                // No next header in this cell — fall through to the next notebook cell
                const notebook = vscode.window.activeNotebookEditor?.notebook;
                if (notebook) {
                    const headersByCell = parseNotebookHeaders(notebook);
                    goToNextHeaderInNotebook(notebook, headersByCell);
                }
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdownMinimapHeaders.goToPreviousHeader', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
                // No focused cell — if a notebook is open, navigate from the end
                const notebook = vscode.window.activeNotebookEditor?.notebook;
                if (notebook) {
                    const headersByCell = parseNotebookHeaders(notebook);
                    goToPreviousHeaderInNotebook(notebook, headersByCell);
                }
                return;
            }
            const found = goToPreviousHeader(editor, parseHeaders(editor.document));
            if (!found) {
                // No previous header in this cell — fall through to the previous notebook cell
                const notebook = vscode.window.activeNotebookEditor?.notebook;
                if (notebook) {
                    const headersByCell = parseNotebookHeaders(notebook);
                    goToPreviousHeaderInNotebook(notebook, headersByCell);
                }
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdownMinimapHeaders.goToNextHeaderInNotebook', () => {
            const notebook = vscode.window.activeNotebookEditor?.notebook;
            if (!notebook) {
                return;
            }

            const headersByCell = parseNotebookHeaders(notebook);
            goToNextHeaderInNotebook(notebook, headersByCell);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdownMinimapHeaders.goToPreviousHeaderInNotebook', () => {
            const notebook = vscode.window.activeNotebookEditor?.notebook;
            if (!notebook) {
                return;
            }

            const headersByCell = parseNotebookHeaders(notebook);
            goToPreviousHeaderInNotebook(notebook, headersByCell);
        }),
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (!e.affectsConfiguration('markdownMinimapHeaders')) {
                return;
            }
            // Any change to our namespace: recreate or destroy the manager
            activeManager?.dispose();
            notebookManager?.dispose();
            activeManager = undefined;
            notebookManager = undefined;
            if (isEnabled()) {
                activeManager = new DecorationManager(!turnOffScrollbar(), headerForeground());
                notebookManager = new DecorationManager(!turnOffScrollbar(), headerForeground());
                updateDecorations(vscode.window.activeTextEditor);
                if (vscode.window.activeNotebookEditor) {
                    updateNotebookDecorations(vscode.window.activeNotebookEditor.notebook);
                }
            }
        }),
    );
}

export function deactivate(): void {
    activeManager?.dispose();
    notebookManager?.dispose();
    activeManager = undefined;
    notebookManager = undefined;
}
