/* eslint-disable */
import * as gmlGlobals from "../gmlGlobals";
import * as vscode from "vscode";

export default class GmlHoverProvider {
    triggerCharacters = ['.'];
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        let result = [];

        let range = document.getWordRangeAtPosition(position);
        const prefix = range ? document.getText(range) : '';
        if (!range) {
            range = new vscode.Range(position, position);
        }
        const added = {};

        const createNewProposal = (kind: vscode.CompletionItemKind, name: string, entry, type = undefined) => {
            const proposal = new vscode.CompletionItem(name);
            proposal.kind = kind;
            if (entry) {
                if (entry.description) {
                    proposal.documentation = new vscode.MarkdownString(entry.description.replaceAll(/^(\t| )+/gm, ""));
                }

                if (entry.signature) {
                    proposal.detail = name + entry.signature;
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
            }
            return proposal;
        };
        const matches = (name) => {
            return prefix.length === 0 || name.length >= prefix.length && name.substr(0, prefix.length) === prefix;
        };

        for (const globalfunctions in gmlGlobals.globalFunctions) {
            if (gmlGlobals.globalFunctions.hasOwnProperty(globalfunctions) && matches(globalfunctions)) {
                added[globalfunctions] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Function, globalfunctions, gmlGlobals.globalFunctions[globalfunctions], "method"));
            }
        }

        for (const globalvariables in gmlGlobals.globalVariables) {
            if (gmlGlobals.globalVariables.hasOwnProperty(globalvariables) && matches(globalvariables)) {
                added[globalvariables] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Variable, globalvariables, gmlGlobals.globalVariables[globalvariables]));
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

        const text = document.getText();

        const macroMatch = /(?<=#macro\s)[a-zA-Z_][a-zA-Z0-9_]*/gm;
        let match = null;
        while (match = macroMatch.exec(text)) {
            const word = match[0];
            if (!added[word]) {
                added[word] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Constant, word, null));
            }
        }

        const variableMatch = /(?<=\bvar\s)\s*[a-zA-Z_][a-zA-Z0-9_]*/gm;
        match = null;
        while (match = variableMatch.exec(text)) {
            const word = match[0];
            if (!added[word]) {
                added[word] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Variable, word, null));
            }
        }

        const functionMatch = /(?:(?<=\bfunction\s)\s*[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()|\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\=\s*function\s*\())/gm;
        match = null;
        while (match = functionMatch.exec(text)) {
            const word = match[0];
            if (!added[word]) {
                added[word] = true;
                result.push(createNewProposal(vscode.CompletionItemKind.Function, word, null, "method"));
            }
        }

        return Promise.resolve(result);
    }
}
