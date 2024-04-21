/* eslint-disable */
import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult
} from 'vscode-languageserver/node';

import { Position, TextDocument } from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
    let capabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true
            }
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability)
    {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability)
    {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});

connection.onDidOpenTextDocument((params) => {
    // A text document was opened in VS Code.
    // params.uri uniquely identifies the document. For documents stored on disk, this is a file URI.
    // params.text the initial full content of the document.
});

connection.onDidChangeTextDocument((params) => {
    // The content of a text document has change in VS Code.
    // params.uri uniquely identifies the document.
    // params.contentChanges describe the content changes to the document.
});

interface FunctionEntry {
    description?: string,
    documentationLink?: string,
    signature?: string
    parameters?: {
        label: string,
        type?: string,
        documentation?: string
    }[]
    returns?: string,
    detail?: string,
    deprecated?: boolean,
    color?: {red: number, green: number, blue: number, alpha: number},
}

interface Settings
{
    simpleMode: boolean
    userGlobals: {
        functions: { [x: string]: FunctionEntry }
        macros: { [x: string]: FunctionEntry }
    }
    enableColors: boolean
    workspaceColors: boolean
    enableCompletions: boolean
    workspaceCompletions: boolean
    semanticTokens: boolean
    colorizeInstanceVariables: boolean
    enableHovers: boolean
    workspaceHovers: boolean
    enableReferences: boolean
    workspaceReferences: boolean
    workspaceDefinitions: boolean
    renameSymbol: boolean
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
const defaultSettings: Settings = {
    simpleMode: false,
    userGlobals: {
        functions: {},
        macros: {},
    },
    enableColors: true,
    workspaceColors: true,
    enableCompletions: true,
    workspaceCompletions: true,
    semanticTokens: true,
    colorizeInstanceVariables: true,
    enableHovers: true,
    workspaceHovers: true,
    enableReferences: true,
    workspaceReferences: true,
    workspaceDefinitions: true,
    renameSymbol: true,
};
let globalSettings: Settings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<Settings>> = new Map();

connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability)
    {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else
    {
        globalSettings = <Settings>(
            (change.settings["gml-ls"] || defaultSettings)
        );
    }

    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<Settings> {
    if (!hasConfigurationCapability)
    {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result)
    {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'gml-ls'
        });
        documentSettings.set(resource, result);
    }
    return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    // In this simple example we get the settings for every validate run.
    // let settings = await getDocumentSettings(textDocument.uri);

    // The validator creates diagnostics for all uppercase words length 2 and more
    let text = textDocument.getText();
    let pattern = /(?<=\#macro)[ ]\b[a-zA-Z_][a-zA-Z_0-9]*\b/g;
    let m: RegExpExecArray | null;
    let pattern2 = /[a-z]/g;
    let n: RegExpExecArray | null;

    let problems = 0;
    let diagnostics: Diagnostic[] = [];
    while ((m = pattern.exec(text)) && (n = pattern2.exec(m[0]))) {
        problems++;
        let diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index + 1),
                end: textDocument.positionAt(m.index + 1)
            },
            message: `${m[0]} is not all uppercase`,
            source: 'gml',
            code: "macro.nameCollisionWarning"
        };
        if (hasDiagnosticRelatedInformationCapability)
        {
            diagnostic.relatedInformation = [
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range)
                    },
                    message: `${m[0]} is not all uppercase, name collisions are more likely to occur`
                }
            ]
        }
        diagnostics.push(diagnostic);
    }

    let badEmbeddedLanguageLiteralMatchRegex = /(\/\*\s*(\w+)\s*\*\/\s*@)(\")/g
    let badEmbeddedLanguageLiteralMatch: RegExpExecArray | null;
    while ((badEmbeddedLanguageLiteralMatch = badEmbeddedLanguageLiteralMatchRegex.exec(text))) {
        problems++;
        let diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(badEmbeddedLanguageLiteralMatch.index),
                end: textDocument.positionAt(badEmbeddedLanguageLiteralMatch.index + badEmbeddedLanguageLiteralMatch[0].length)
            },
            message: `embedded language strings should use single quotes`,
            source: 'gml',
            code: "string.badEmbeddedLanguageLiteral",
        };
        if (hasDiagnosticRelatedInformationCapability)
        {
            diagnostic.relatedInformation = [
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range)
                    },
                    message: `embedded language strings should use single quotes`
                }
            ]
        }
        diagnostics.push(diagnostic);
    }

    // let structMemberMatchRegex = /\b[0-9]+\s*:/g
    // let structMemberMatch: RegExpExecArray | null;
    // while ((structMemberMatch = structMemberMatchRegex.exec(text))) {
    //     problems++;
    //     let diagnostic: Diagnostic = {
    //         severity: DiagnosticSeverity.Error,
    //         range: {
    //             start: textDocument.positionAt(structMemberMatch.index + 1),
    //             end: textDocument.positionAt(structMemberMatch.index + 1)
    //         },
    //         message: `struct member names cannot be a number`,
    //         source: 'gml',
    //         code: "struct.illegalMemberNameError"
    //     };
    //     if (hasDiagnosticRelatedInformationCapability)
    //     {
    //         diagnostic.relatedInformation = [
    //             {
    //                 location: {
    //                     uri: textDocument.uri,
    //                     range: Object.assign({}, diagnostic.range)
    //                 },
    //                 message: `struct member names cannot be a number`
    //             }
    //         ]
    //     }
    //     diagnostics.push(diagnostic);
    // }

    // let numberStartVariableNameMatchRegex = /\b[0-9]+[a-zA-Z_]+\b/g
    // let numberStartVariableNameMatch: RegExpExecArray | null;
    // while (((numberStartVariableNameMatch = numberStartVariableNameMatchRegex.exec(text)))) {
    //     if(numberStartVariableNameMatch[0].match(/^0(b|x|o)/))
    //         continue;
    //     problems++;
    //     let diagnostic: Diagnostic = {
    //         severity: DiagnosticSeverity.Error,
    //         range: {
    //             start: textDocument.positionAt(numberStartVariableNameMatch.index + 1),
    //             end: textDocument.positionAt(numberStartVariableNameMatch.index + 1)
    //         },
    //         message: `variable names cannot start with a number`,
    //         source: 'gml',
    //         code: "identifier.illegalNameError"
    //     };
    //     if (hasDiagnosticRelatedInformationCapability)
    //     {
    //         diagnostic.relatedInformation = [
    //             {
    //                 location: {
    //                     uri: textDocument.uri,
    //                     range: Object.assign({}, diagnostic.range)
    //                 },
    //                 message: `variable names cannot start with a number`
    //             }
    //         ]
    //     }
    //     diagnostics.push(diagnostic);
    // }

    // Send the computed diagnostics to VS Code.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VS Code
    connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion((context: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
        {
            label: '#macro',
            data: "macro",
            kind: CompletionItemKind.Constant
        }
    ];
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    switch (item.data)
    {
        case "macro":
        {
            item.detail = 'Macro';
            break;
        }
    }
    return item;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
