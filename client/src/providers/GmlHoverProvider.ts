/* eslint-disable */
import * as gmlGlobals from "../gmlGlobals";
import * as vscode from "vscode";

import { FunctionEntry } from "../gmlGlobals";

class MarkdownString extends vscode.MarkdownString
{
    supportHtml: boolean = true;
    isTrusted?: boolean | { readonly enabledCommands: readonly string[]; } = true;
}

const createMDString = (input: string, lang?: string): MarkdownString => {
    const md = new MarkdownString("")
    md.supportHtml = true
    const values = input.split("''")
    for(var i = 0; i < values.length; i++)
    {
        const val = values[i]
        if(i % 2 == 1)
            md.appendCodeblock(val, lang)
        else
            md.appendMarkdown(val)
    }
    return md
}

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

        let inWhitespacePattern = new RegExp("(\\/\\/.*" + name + ".*|\\/\\*.*" + name + ".*\\*\\/|\".*" + name + ".*[^\\\\]\"|'.*" + name + ".*[^\\\\]')", "g")
        let inWhitespace: RegExpExecArray = null
        while(inWhitespace = inWhitespacePattern.exec(document.getText()))
        {
            if((inWhitespace.index <= document.offsetAt(position)) && ((inWhitespace.index + inWhitespace[0].length - 1) >= (document.offsetAt(position) + name.length - 1))) return undefined
            /** @todo make this not ignore code inside of template strings */
        }

        if(name == "#macro" || name == "var" || name == "function")
        {
            return undefined;
        }

        let type = "method";
        let _type = "";
        let entry = gmlGlobals.globalFunctions[name];
		if(!entry) {entry = gmlGlobals.globalVariables[name]; type = "";}
		if(!entry) {entry = gmlGlobals.constants[name]; type = "";}
		if(!entry) {entry = gmlGlobals.keywords[name]; type = ""; _type = "keyword"}

        const createHover = (entry: FunctionEntry) =>
        {
            const contents = [];
            let signature = name
            if(entry.signature) {
                signature = name + entry.signature;
            }
            if(entry.parameters)
            {
                signature = type ? `(${type}) ` : '    ';
                signature += name;
                signature += '(';
                if (entry.parameters && entry.parameters.length != 0) {
                    let params = '';
                    entry.parameters.forEach(p => params += p.label + (p.type ? (": " + p.type) : "") + ', ');
                    signature += params.slice(0, -2);
                }
                signature += ')' + (entry.returns ? (": " + entry.returns) : ": void");
            }

            contents.push(new MarkdownString().appendCodeblock(signature, entry.parameters ? "typescript" : undefined));

            let docLink = entry.documentationLink ? "[Go to Documentation](https://manual.gamemaker.io/monthly/en/GameMaker_Language/GML_Reference/" + entry.documentationLink + ".htm)" : null

            if(entry.description)
                contents.push(createMDString(
                    (entry.deprecated ? "*Deprecated or Obsolete*\n\n" : "") + entry.description.replaceAll(/^(\t| )+/gm, "") + (docLink ? "\n\n" + docLink : "")
                ));
            else if(entry.documentationLink)
                contents.push(createMDString((entry.deprecated ? "*Deprecated or Obsolete*\n\n" : "") + docLink))
            else if(entry.deprecated)
                contents.push(createMDString("*Deprecated or Obsolete*"))

            return new vscode.Hover(contents, wordRange);
        }
        if(entry)
		{
            if(_type == "keyword" && name == "noone")
                return new vscode.Hover([
                    new MarkdownString().appendCodeblock(`-4`)
                ], wordRange)
            if(_type == "keyword")
                return undefined;
            return createHover(entry)
        }

        for(const document of vscode.workspace.textDocuments)
        {
            const text = document.getText()

            let macrodef = new RegExp("#macro (" + name + ") ((?:[^\\n](\\\\(\\n|\\r\\n))?)+(?=\\n|$))").exec(text)
            if(macrodef)
            {
                return new vscode.Hover([
                    new MarkdownString().appendCodeblock(`#macro ${name}: ${macrodef[2]}`)
                ], wordRange)
            }

            let gopbal = new RegExp("\\bglobal\\s*\\.(\\s*\\w+\\s*\\.\\s*)*(" + name + ")").exec(text)
            if(gopbal)
            {
                return new vscode.Hover([
                    new MarkdownString().appendCodeblock(`${gopbal[0]}`)
                ], wordRange)
            }

            let functionMatch1 = new RegExp("(?<=\\bfunction\\s)\\s*" + name + "\\s*\\((.*)\\)\\s*(constructor)?").exec(text);
            let functionMatch2 = new RegExp("\\b" + name + "\\s*(=|:)\\s*function\\s*\\((.*)\\)\\s*(constructor)?").exec(text);
            if(functionMatch1 || functionMatch2)
            {
                return new vscode.Hover([
                    new MarkdownString().appendCodeblock(`\(${functionMatch1 ? (functionMatch1[2] === "constructor" ? "constructor" : "method") : (functionMatch2[3] === "constructor" ? "constructor" : "method")}) ${name}(${functionMatch1 ? functionMatch1[1] : functionMatch2[1]})${functionMatch1 ? (functionMatch1[2] === "constructor" ? ": " + name : "") : (functionMatch2[3] === "constructor" ? ": " + name : "")}`, "typescript")
                ], wordRange)
            }
        }

        const text = document.getText()

        let vardef = new RegExp("\\bvar\\s+(" + name + ")\\b").exec(text)
        if(vardef)
        {
            return new vscode.Hover([
                new MarkdownString().appendCodeblock(`var ${name}`)
            ], wordRange)
        }

        let numberLiteral = /\b0(b[0-1]+|x[0-9a-fA-F]+|o[0-7]+)\b/.exec(name)
        if(numberLiteral)
        {
            return new vscode.Hover([
                new MarkdownString().appendCodeblock(`${Number(numberLiteral[0])}`)
            ], wordRange)
        }

        return undefined;
    }
}
