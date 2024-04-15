/* eslint-disable */
import * as gmlGlobals from "../gmlGlobals";
import * as vscode from "vscode";

export default class GmlHoverProvider {
    public provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }
        const name = document.getText(wordRange);
        let backchar = '';
        if (wordRange.start.character > 0) {
            let backidx = wordRange.start.translate({ characterDelta: -1 });
            backchar = backidx.character < 0 ? '' : document.getText(new vscode.Range(backidx, wordRange.start));
        }

        if(name == "#macro" || name == "var" || name == "function")
        {
            return undefined;
        }

        let type = "method";
        let entry = gmlGlobals.globalFunctions[name];
		if(!entry) {entry = gmlGlobals.constants[name]; type = "";}
		if(!entry) {entry = gmlGlobals.globalVariables[name]; type = "";}
		if(!entry) {entry = gmlGlobals.keywords[name]; type = "";}

        const createHover = (entry) =>
        {
            const contents = [];
            let signature = "    " + name
            if (entry.signature) {
                signature = "    " + name + entry.signature;
            }
            if(entry.parameters)
            {
                signature = type ? `    (${type}) ` : '    ';
                signature += name;
                signature += '(';
                if (entry.parameters && entry.parameters.length != 0) {
                    let params = '';
                    entry.parameters.forEach(p => params += p.label + (p.type ? (": " + p.type) : "") + ', ');
                    signature += params.slice(0, -2);
                }
                signature += ')' + (entry.returns ? (": " + entry.returns) : ": void");
            }

            contents.push(new vscode.MarkdownString(signature));

            if(entry.description)
            	contents.push(new vscode.MarkdownString(entry.description.replaceAll(/^(\t| )+/gm, "")));

            return new vscode.Hover(contents, wordRange);
        }

        if(entry)
		{
            return createHover(entry)
        }

        const text = document.getText()

        let macrodef = new RegExp("\\#macro\\s" + name + "\\b").exec(text)
        if(macrodef)
        {
            return new vscode.Hover([
                new vscode.MarkdownString(`    #macro ${name}`)
            ], wordRange)
        }

        let vardef = new RegExp("\\bvar\\s+(" + name + ")\\b").exec(text)
        if(vardef)
        {
            return new vscode.Hover([
                new vscode.MarkdownString(`    var ${name}`)
            ], wordRange)
        }

        let functionMatch = new RegExp("((?<=\\bfunction\\s)\\s*" + name + "(?=\\s*\\()|\\b" + name + "(?=\\s*=\\s*function\\s*\\())").exec(text);
        if(functionMatch)
        {
            return new vscode.Hover([
                new vscode.MarkdownString(`    (method) ${name}()`)
            ], wordRange)
        }

        let numberLiteral = /\b0(b[0-1]+|x[0-9a-fA-F]+|o[0-7]+)\b/.exec(name)
        if(numberLiteral)
        {
            return new vscode.Hover([
                new vscode.MarkdownString(`    ${Number(numberLiteral[0])}`)
            ], wordRange)
        }

        return undefined;
    }
}
