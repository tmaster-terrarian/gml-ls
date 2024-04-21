/* eslint-disable */
import * as gmlGlobals from "./gmlGlobals";
import * as vscode from "vscode";

import { FunctionEntry } from "./gmlGlobals";

export default class GmlCompletionProvider implements vscode.CompletionItemProvider {
    triggerCharacters = ['.'];
    globals = {}
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionItem[]>
    {
        if(vscode.workspace.getConfiguration('gml-ls').get('simpleMode', false)) return
        if(!vscode.workspace.getConfiguration('gml-ls').get('enableCompletions', true)) return

        const includeWorkspaceCompletions = vscode.workspace.getConfiguration('gml-ls').get('workspaceCompletions', true)

        let result = [];

        let range = document.getWordRangeAtPosition(position);
        const prefix = range ? document.getText(range) : '';
        if (!range) {
            range = new vscode.Range(position, position);
        }
        const added = {};

        const createNewProposal = (kind: vscode.CompletionItemKind, name: string, entry: FunctionEntry, type = undefined) => {
            const proposal = new vscode.CompletionItem(name);
            proposal.kind = kind;
            if (entry) {
                const tags = []

                if (entry.description) {
                    proposal.documentation = new vscode.MarkdownString(entry.description.replaceAll(/^(\t| )+/gm, ""));
                }

                if(entry.deprecated)
                    tags.push(vscode.CompletionItemTag.Deprecated)

                if(entry.color) {
                    proposal.kind = vscode.CompletionItemKind.Color
                }

                if (entry.signature) {
                    proposal.detail = entry.signature;
                }
                if (entry.parameters) {
                    let signature = type ? `(${type}) ` : '';
                    signature += name;
                    signature += '(';
                    if (entry.parameters && entry.parameters.length != 0) {
                        let params = '';
                        entry.parameters.forEach(p => params += p.label + (p.type ? (": " + p.type) : "") + ', ');
                        signature += params.slice(0, -2);
                    }
                    signature += ')' + (entry.returns ? (": " + entry.returns) : ": void");
                    proposal.detail = signature;
                }
                if (entry.detail) {
                    proposal.detail = entry.detail;
                }
                proposal.tags = tags
            }
            return proposal;
        };
        const matches = (name) => {
            return prefix.length === 0 || name.length >= prefix.length && name.substr(0, prefix.length) === prefix;
        };

        for (const globalFunctions in gmlGlobals.globalFunctions) {
            if (gmlGlobals.globalFunctions.hasOwnProperty(globalFunctions) && matches(globalFunctions)) {
                added[globalFunctions] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Function, globalFunctions, gmlGlobals.globalFunctions[globalFunctions], "method"));
            }
        }

        for (const globalVariables in gmlGlobals.globalVariables) {
            if (gmlGlobals.globalVariables.hasOwnProperty(globalVariables) && matches(globalVariables)) {
                added[globalVariables] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Variable, globalVariables, gmlGlobals.globalVariables[globalVariables]));
            }
        }

        for (const constants in gmlGlobals.constants) {
            if (gmlGlobals.constants.hasOwnProperty(constants) && matches(constants)) {
                added[constants] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Constant, constants, gmlGlobals.constants[constants]));
            }
        }

        for (const keywords in gmlGlobals.keywords) {
            if (gmlGlobals.keywords.hasOwnProperty(keywords) && matches(keywords)) {
                added[keywords] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Keyword, keywords, gmlGlobals.keywords[keywords]));
            }
        }

        if(!includeWorkspaceCompletions) return result

        const text = document.getText();

        const variableMatch = /(?<=\bvar\s)\s*[a-zA-Z_][a-zA-Z0-9_]*/gm;
        let match: RegExpExecArray = null;
        while (match = variableMatch.exec(text)) {
            const word = match[0];
            if(position.line - document.positionAt(match.index).line > -1)
                if (!added[word]) {
                    added[word] = true;
                    result.push(createNewProposal(vscode.CompletionItemKind.Variable, word, null));
                }
        }

        for(const document of vscode.workspace.textDocuments)
        {
            if(!document.uri.path.endsWith(".gml")) continue

            const text = document.getText()

            const macroMatch = /#macro ([a-zA-Z_][a-zA-Z0-9_]*) ((?:[^\n](\\(\n|\r\n))?)+(?=\n|$))/g;
            match = null;
            while (match = macroMatch.exec(text)) {
                const word = match[1];
                if (!added[word]) {
                    added[word] = true;
                    result.push(createNewProposal(vscode.CompletionItemKind.Constant, word, {
                        detail: "#macro " + word,
                        description: `value:\n\`\`\`\n${match[2]}\n\`\`\``
                    }));
                }
            }

            const functionMatch = /(?<=\bfunction\s)\s*[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/gm;
            match = null;
            while (match = functionMatch.exec(text)) {
                const word = match[0];
                if (!added[word]) {
                    added[word] = true;
                    result.push(createNewProposal(vscode.CompletionItemKind.Function, word, null, "method"));
                }
            }

            // const globalMatch = /\bglobal\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)/g;
            // match = null;
            // while (match = globalMatch.exec(text)) {
            //     const word = match[1];
            //     result.push(createNewProposal(vscode.CompletionItemKind.Property, word, null));
            // }
        }

        // const commandCompletion = new vscode.CompletionItem('new');
        // commandCompletion.kind = vscode.CompletionItemKind.Keyword;
        // commandCompletion.insertText = 'new ';
        // commandCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };

        return result;
    }
}
