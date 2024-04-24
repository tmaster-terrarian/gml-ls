/* eslint-disable */
import * as vscode from "vscode";
import * as gmlGlobals from "./gmlGlobals"
import * as lib from '../../../lib/out/lib';

// #04de80 is very green

export default class GmlDocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    legend: vscode.SemanticTokensLegend

    constructor(legend: vscode.SemanticTokensLegend)
    {
        this.legend = legend;
    }

    async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens>
    {
        if(vscode.workspace.getConfiguration('gml-ls').get('simpleMode', false)) return
        if(!vscode.workspace.getConfiguration('gml-ls').get('semanticTokens.enabled', true)) return

        const text = document.getText()

        const tokensBuilder = new vscode.SemanticTokensBuilder(this.legend);

        const wordPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g
        let wordMatch: RegExpExecArray = null
        while(wordMatch = wordPattern.exec(text))
        {
            const position = document.positionAt(wordMatch.index)
            const wordRange = new vscode.Range(position, document.positionAt(wordMatch.index + wordMatch[0].length))
            const word = wordMatch[0]

            let inWhitespacePattern = new RegExp("(\\/\\/.*" + word + ".*|\\/\\*(.|\\n)*" + word + "(.|\\n)*\\*\\/|\".*" + word + ".*?[^\\\\]\"|'.*" + word + ".*?[^\\\\]'|\\benum \\w+\\s*\\{(.|\\n)*" + word + "(.|\\n)*?\\})", "g")
            let inWhitespace: RegExpExecArray = null
            let cont = false
            while(inWhitespace = inWhitespacePattern.exec(text))
            {
                if((inWhitespace.index <= wordMatch.index) && ((inWhitespace.index + inWhitespace[0].length) >= (wordMatch.index + wordMatch[0].length - 1)))
                {
                    cont = true
                    break
                }
                /** @todo make this not ignore code inside of template strings */
            }
            if(cont) continue

            let entry = gmlGlobals.globalFunctions.hasOwnProperty(word) ? gmlGlobals.globalFunctions[word] : null, type = "function"
            if(!entry) {entry = gmlGlobals.globalVariables.hasOwnProperty(word) ? gmlGlobals.globalVariables[word] : null; type = "variable"}
            if(!entry) {entry = gmlGlobals.constants.hasOwnProperty(word) ? gmlGlobals.constants[word] : null; type = "constant"}

            if(entry)
            {
                let modifiers = ['defaultLibrary']

                if(entry.deprecated)
                    modifiers.push('deprecated')

                let _type = "variable"
                if(type == "function")
                    _type = "function"
                if(type == "variable" && vscode.workspace.getConfiguration('gml-ls').get('semanticTokens.instanceVariables', true))
                    modifiers.push('builtinLocal')
                if(type == "constant")
                    modifiers = ["readonly"]

                tokensBuilder.push(
                    wordRange,
                    _type,
                    modifiers
                )
                continue
            }

            // let vardef = new RegExp("\\bvar\\s+" + word + "\\b").exec(text)
            // if(vardef)
            // {
            //     tokensBuilder.push(
            //         wordRange,
            //         'variable',
            //         ['local']
            //     )
            //     continue
            // }

            // const documents = await lib.getWorkspaceDocuments(await vscode.workspace.findFiles("**/*.gml"))

            for(const document of vscode.workspace.textDocuments)
            {
                if(!document.uri.path.endsWith(".gml")) continue

                const text = document.getText()

                let macrodef = new RegExp("#macro " + word + "\\b").exec(text)
                if(macrodef)
                {
                    tokensBuilder.push(
                        wordRange,
                        'variable',
                        ['readonly']
                    )
                    break
                }

                let enumdef = new RegExp("\\benum\\s+" + word + "\\b").exec(text)
                if(enumdef)
                {
                    tokensBuilder.push(
                        wordRange,
                        'enum',
                        ['readonly']
                    )
                    break
                }

                let functionMatch1 = new RegExp("\\bfunction\\s+" + word + "\\s*\\(.*\\)\\s*(constructor)?").exec(text);
                let functionMatch2 = new RegExp("\\b" + word + "\\s*(=|:)\\s*function\\s*\\(.*\\)\\s*(constructor)?").exec(text);
                if(functionMatch1)
                {
                    if(functionMatch1[1] === "constructor")
                    {
                        tokensBuilder.push(
                            wordRange,
                            'class',
                            ['constructor']
                        )
                    }
                    else
                    {
                        tokensBuilder.push(
                            wordRange,
                            'function'
                        )
                    }
                    break
                }
                else if(functionMatch2)
                {
                    if(functionMatch2[2] === "constructor" && functionMatch2[1] !== ":")
                    {
                        tokensBuilder.push(
                            wordRange,
                            'class',
                            ['constructor']
                        )
                    }
                    else
                    {
                        tokensBuilder.push(
                            wordRange,
                            'function'
                        )
                    }
                    break
                }
                else if(lib.State.get<lib.ResourceList>("yypResources").has(word) && vscode.workspace.getConfiguration('gml-ls').get('semanticTokens.resources', true))
                {
                    tokensBuilder.push(
                        wordRange,
                        'variable',
                        ['resource']
                    )
                    break
                }
            }
        }

        return tokensBuilder.build();
    }
}
